import React, { Component, ReactDOM } from "react";
import API from "../../utils/API";
// import { Link, push } from "react-router-dom";
import { Col, Row, Grid, Button } from 'react-bootstrap';
import WishForm from "../../components/WishForm";
import './Wish.css';
import firebase from '../../fire.js';
// import { geolocated } from 'react-geolocated';
import MatchContainer from '../../components/MatchContainer';
// import moment from 'moment';
import {fire, auth} from '../../fire.js';


class Wish extends Component {
  //allows access to props if you pass down, allows console logging
  constructor(props) {
    //allows ability to set state if you want to
    super(props);

    this.state = {
      id: "",
      email: "", //need to add email or id in order to link mongo info (rating, name) to firebase info (delivery location)
      name: this.props.name,
      isLoggedIn: true,
      business: "",
      location: "",
      lat: "",
      long: "",
      request: "",
      wishes: [],
      matches: [],
      hasMatched: false,
      fireKey: "",
      clickedKey: "",
      grantReceived: [],
      wishSent: [],
      viewOutgoingReq: false,
      viewIncomingReq: false
    };

    this.handleInputChange = this.handleInputChange.bind(this);
  }


  componentDidMount = () => {
    this.authListener();
  };

  authListener = () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            this.setState({
                email: user.email,
                id: user.uid
            })
        } else {
        console.log("user signed out");
    }

  });
}


  handleInputChange = event => {
    const { name, value } = event.target;
    this.setState({
      [name]: value
    });
    console.log(this.state)
    console.dir(event.target)
  };

  
  getMatchedUserInfo = (arr) => {
    console.log("id of match", arr)
    let finalMatches = [];
    for (let i = 0; i < arr.length; i++) {
      console.log("made it to for loop", arr[i].userId);
      API.getUserId(arr[i].userId)
          .then(res => {(res.data.fire = arr[i].fireKey);
          console.log(res.data);
          finalMatches.push(res.data);
          this.setState({
            matches: finalMatches,
            hasMatched: true
          });
          console.log(this.state.matches)
        })
        .catch(err => console.log(err));
    }
  }


  getDistance = (lat1, lon1, lat2, lon2) => {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p) / 2 +
      c(lat1 * p) * c(lat2 * p) *
      (1 - c((lon2 - lon1) * p)) / 2;

    var km = 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    var miles = km * 0.62137;
    console.log("miles", miles);
    return miles;
  }

  getGrantMatches = (matches) => {
    console.log("get matches running", matches);
    let grantArr = [];
    for (let i = 0; i < matches.length; i++) {
      firebase.database().ref(this.state.business + '/grants/' + matches[i]).on('value', grant => {
        if(!this.state.clickedKey){
        const allGrants = grant.val();
        grantArr.push(allGrants)
        }
      })
      this.getMatchedUserInfo(grantArr);
    }
  }

  findGrantMatch = () => {
    console.log("running find grant match")
    firebase.database().ref(this.state.business + '/grants').on('value', grant => {
      if(!this.state.clickedKey){
        const allGrants = grant.val();
        if (allGrants) {
          const matches = Object.keys(allGrants).filter(e => this.getDistance(this.state.lat, this.state.long, allGrants[e].lat, allGrants[e].long) <= allGrants[e].range)
          this.getGrantMatches(matches);
        } else { console.log("no matches") }
      }
     
    });
  }

  handleWishSubmit = () => {
    if (this.state.business && this.state.location && this.state.request) {
      let allWishes = this.state.wishes;
      const newWish = {
        userId: this.state.id,
        business: this.state.business,
        location: this.state.location,
        lat: this.state.lat,
        long: this.state.long,
        request: this.state.request,
        created: Date.now(),
        requested: false,
        requests: {name: "", location:"", id:"", key:""},
        completed: false,
        fireKey: ""
      };
      allWishes.push(newWish);
      console.log("new wish", newWish)
      this.setState({ wishes: allWishes })
      let newEntry = firebase.database().ref(newWish.business + '/wishes').push(newWish);
      // newEntry.push(newWish)
      let key = newEntry.key
      this.setState({
        fireKey: key
      })
      firebase.database().ref(newWish.business + '/wishes/' + key)
      .update({ fireKey: key });
      console.log("LOOK AT ME", this.state)
      this.findGrantMatch();
      this.listenForRequest();
    }
  }



  getLatLng = (event) => {
    event.preventDefault();
    let address = this.state.location;
    let queryAddress = address.split(' ').join('+');
    console.log("address", queryAddress);
    API.getLocation(queryAddress)
      .then(res => {
        if (res.status === "OK" || res.status !== "ZERO_RESULTS") {
          let lat = res.data.results[0].geometry.location.lat;
          let long = res.data.results[0].geometry.location.lng;

          this.setState({
            lat: lat,
            long: long
          })
        } else {
          console.log("bad address input, try again")
        }
        this.handleWishSubmit()

      });
  }

  handleSelect = (id, name, location) => {
    console.log("the id of button clicked", id)
    let allRequests = [];
    let newReq = {name: name, location: location, id: id};
    allRequests.push(newReq)
    this.setState({clickedKey: id, wishSent: allRequests}, 
        () => this.updateUserSelected())
     }
 

    updateUserSelected = () => {
    console.log("clicked key on state", this.state.clickedKey)
    let match = {name: this.state.name, location: this.state.location, request: this.state.request, id: this.state.id, key: this.state.fireKey}
    console.log("match passing to FB", match)
      firebase.database().ref(this.state.business + "/grants/" + this.state.clickedKey)
      .update({requests: match, requested: true});

    };

    listenForRequest = () => {
        console.log("LISTEN FOR RE RUNNING", this.state.fireKey)
        firebase.database().ref(this.state.business + '/grants/' + this.state.fireKey + '/requests').on('value', snapshot => {
        console.log("snapshot", snapshot.val());
        if(snapshot.val() === null || snapshot.val().id === ""){
            console.log("nothing to snap");
        }else{
            let newGrant = {name: snapshot.val().name, 
                location: snapshot.val().location, 
                id: snapshot.val().id, 
                key: snapshot.val().key}
            let allGrantsReceived = this.state.grantRecieved;
            allGrantsReceived.push(newGrant)
            this.setState({
                grantReceived: allGrantsReceived
            })
            console.log("state after request comes through", this.state)
        }
    });
  }

  toggleViewOutgoing = () => {
    this.setState({
        viewOutgoingReq: !this.state.viewOutgoingReq
      })
      if (this.state.hasMatched === true) {
        this.setState({
          hasMatched: false
        })
      }
      if (this.state.viewIncomingReq === true) {
        this.setState({
          viewIncomingReq: false
        })
      }
      console.log(this.state)
}

toggleViewIncoming = () => {
    this.setState({
        viewIncomingReq: !this.state.viewIncomingReq
      })
      if (this.state.hasMatched === true) {
        this.setState({
          hasMatched: false
        })
      }
      if (this.state.viewOutgoingReq === true) {
        this.setState({
          viewOutgoingReq: false
        })
      }
      console.log(this.state)
}

  render() {
    return (
      <div>
        <Grid fluid>
          <Row>
            <Col md={12}>
              <WishForm
                type="text"
                busSelect={this.state.businessOptions}
                busValue={this.state.business}
                locValue={this.state.location}
                reqValue={this.state.request}
                getLocation={this.getCurrentPosition}
                onChange={this.handleInputChange.bind(this)}
                onSubmit={this.getLatLng}
              /> 
            </Col>
          </Row>
        </Grid>
        <Grid>
            <Row>
                <Col sm={3}>
                <Button onClick={this.toggleViewOutgoing}>View My Outgoing Requests</Button>
                </Col>
                <Col sm={3}>
                <Button onClick={this.toggleViewIncoming}>View My Incoming Requests</Button>
                </Col>
            </Row>
        </Grid>
        {this.state.hasMatched ? <MatchContainer matches={this.state.matches} onClick={this.handleSelect}/>
          : null}
        {this.state.viewOutgoingReq ? <MatchContainer matches={this.state.wishSent} /> : null}

        {this.state.viewIncomingReq ? <MatchContainer matches={this.state.grantReceived} /> : null}
      </div>
    );
  }
}


export default Wish;