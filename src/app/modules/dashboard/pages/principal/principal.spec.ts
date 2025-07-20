import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Principal } from './principal';

describe('Principal', () => {
  let component: Principal;
  let fixture: ComponentFixture<Principal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Principal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Principal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
