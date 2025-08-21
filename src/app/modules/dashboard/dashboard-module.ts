import { Header } from './../../layout/header/header';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing-module';
import { Principal } from './pages/principal/principal';
import { Footer } from '../../layout/footer/footer';
import { Admin } from './pages/admin/admin';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Web3LoginComponent } from './pages/loginWeb3/web3-login-component/web3-login-component';


@NgModule({
  declarations: [
    Principal,
    Footer,
    Header,
    Admin,
    Web3LoginComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    FormsModule,
    FormsModule,
RouterModule ,
MatCardModule ,
MatBadgeModule,
MatInputModule,
MatMenuModule,
MatListModule,
MatToolbarModule,
MatButtonModule,
MatIconModule,
MatSidenavModule ,


  ]
})
export class DashboardModule { }
