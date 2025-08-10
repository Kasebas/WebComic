import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComicLibraryComponent } from './comic-library.component';

describe('ComicLibraryComponent', () => {
  let component: ComicLibraryComponent;
  let fixture: ComponentFixture<ComicLibraryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComicLibraryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ComicLibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
