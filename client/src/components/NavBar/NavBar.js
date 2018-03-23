import React from "react";
import { Nav, NavItem } from 'react-bootstrap';

const NavBar = () =>


<Nav bsStyle="tabs" activeKey="1" onSelect={k => this.handleSelect(k)}>
  <NavItem eventKey="1" href="/">
    Wish
  </NavItem>
  <NavItem eventKey="2" href="/about">
    Home
  </NavItem>
  <NavItem eventKey="3" href="/matches">
    Matches
  </NavItem>
  <NavItem eventKey="4" href="/account">
    Account
  </NavItem>
  <NavItem eventKey="5" href="/login">
    Logout
  </NavItem>
</Nav>

export default NavBar;