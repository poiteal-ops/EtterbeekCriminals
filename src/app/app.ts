import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { FooterBar } from './shared/footer-bar/footer-bar';
import { NavBar } from './shared/nav-bar/nav-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar, FooterBar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
