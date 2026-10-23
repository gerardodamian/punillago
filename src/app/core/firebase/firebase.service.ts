import { Injectable } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app: FirebaseApp = getApps().length ? getApp() : initializeApp(environment.firebase);
  readonly db: Firestore = getFirestore(this.app);
  readonly auth: Auth = getAuth(this.app);
  readonly regionId = environment.regionId;
}
