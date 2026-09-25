import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: appConfig.providers,
    }).compileComponents();
  });

  it('should render the chat', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-assistant-chat')).toBeTruthy();
  });
});
