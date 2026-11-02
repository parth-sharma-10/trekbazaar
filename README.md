# TrekBazaar

A MERN marketplace for Indian treks. Trekkers can browse, filter, wishlist and book treks. Operators can publish and manage listings. Admins can moderate users, operators and reviews.

It started as a Figma Make UI/UX export (19 static screens). This repo turns that export into a runnable app: it adds URL routing, shared state that survives a reload, form validation, and working versions of the buttons that did nothing in the design.

> Treks, bookings and user accounts are stored in MongoDB behind an Express REST API. Passwords are hashed with scrypt. API calls carry a signed session token and every route checks the caller's role. Checkout takes no payment, and messages, emails and SMS are simulated with on-screen notices.

Live: **https://trekbazaar-eta.vercel.app** (Vercel, with MongoDB Atlas). The demo data is shared, so bookings made there are visible to everyone. As of 2026-11-03 the live database still holds the earlier 8-trek seed; the 28-trek seed below has not been loaded there.

![Landing page](docs/landing.jpg)

| Explore | Trek details | Operator dashboard |
|---|---|---|
| ![Explore](docs/explore.jpg) | ![Trek details](docs/trek.jpg) | ![Operator dashboard](docs/operator.jpg) |

## What works

**Trekkers**
- Search from the landing page, or use the quick tags and destination tiles. All of them open Explore pre-filtered.
- On Explore, filter by text, difficulty, duration, maximum price and state. Sort the results, and switch between grid and list views.
- The trek page has a gallery, tabs (overview, itinerary, inclusions, reviews), the operator's scheduled departures with live seats left, and a price breakdown.
- Booking is a request, not a payment: choose a departure, enter traveller and safety details, review, send. It is stored as Pending until the operator confirms it. No payment is taken anywhere in the app.
- The confirmation page shows the stored request and its status. You can download a summary as a `.txt` file.
- My Bookings has status filters, cancellation (with a confirm step), and a review form on completed trips. Reviews go public after an admin approves them.
- The wishlist is shared across every screen and kept in this browser.
- Settings: edit your profile, change your password, toggle dark mode, clear this browser's saved data.

**Theme**
- Dark mode follows the system setting (`prefers-color-scheme`) until you pick one with the navbar toggle, the mobile menu or Settings; the choice is kept in `localStorage`.
- Cards lift on hover, buttons react to presses, and the scrollbar is styled to match the theme.
- The dark theme has its own colour tokens for text, form controls, tables, badges and modals.

**Operators**
- A new operator account must be verified by an admin before it can publish.
- Add or edit a trek, with per-field validation, and manage its departures and seats. A departure cannot be cut below the seats already booked.
- Booking management: confirm or decline requests, mark trips completed, and see each trekker's contact and safety details.
- Booking analytics (3M / 6M / 12M) worked out from the operator's own bookings.

**Admins**
- Dashboard figures, alerts and the newest accounts come from the database.
- User management: search, filter, change a role, suspend, reinstate, delete.
- Operator verification: verify or revoke operator accounts.
- Review moderation: approve or reject. Ratings shown anywhere in the app are averages of approved reviews.

Every number and list on these screens comes from MongoDB through the API; nothing is hardcoded in the UI. The database starts from the seed described under [Seed data](#seed-data).

**Across the app**
- Hash-based URLs (`#/trek-details?trek=3`). Deep links, the browser Back button and page refresh all work, and the app runs on any static host with no server rewrites.
- Role screens need a signed-in account of that role. A guest opening one by URL is sent to the login page; a signed-in user is sent to their own dashboard.
- Responsive at phone widths (checked at 381px for every screen). Wide tables scroll horizontally inside their card instead of overflowing the page.
- Accessibility basics: labelled inputs, `aria-pressed` and `aria-expanded` on toggles, keyboard-reachable trek cards, error messages announced with `role="alert"`, and the hero's bounce animation turns off under `prefers-reduced-motion`.

## Run it

Requires Node.js 22.18 or later and MongoDB running locally (default `mongodb://127.0.0.1:27017/trekbazaar`, override with `MONGO_URI`). The seed script and tests import the TypeScript seed data directly through Node's built-in type stripping.

```bash
npm install
npm run seed       # load the demo treks, bookings and accounts into MongoDB
npm run server     # Express API on http://localhost:4000
npm run dev        # http://localhost:5173 (proxies /api to the server)
npm test           # unit tests + API integration tests (uses the trekbazaar_test database)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Deploy (Vercel)

`vercel.json` builds the Vite frontend as static files and serves the Express app as one serverless function (`api/index.js`), with `/api/*` rewritten to it. The function needs a hosted MongoDB, for example a free MongoDB Atlas cluster that allows connections from `0.0.0.0/0`, since Vercel functions have no fixed IP.

```bash
vercel link
vercel env add MONGO_URI production   # Atlas connection string, including /trekbazaar as the database
vercel env add AUTH_SECRET production # signs login tokens: openssl rand -hex 32
MONGO_URI='<atlas uri>' SEED_ADMIN_PASSWORD='<private>' npm run seed
vercel deploy --prod
```

Vercel compiles `.ts` files to `.js` without rewriting import paths, so server code imports `src/pricing.js` (plain JS) rather than `src/lib.ts`.

## Project structure

```
src/
  App.tsx            hash router: maps routes to screens, sets the page title, renders the toast
  router.ts          parseHash / toHash (used with react-router-dom's HashRouter)
  api.ts             axios instance and error-message helper
  store.tsx          React context: loads treks and bookings from the API; user, session token, wishlist and theme in localStorage
  lib.ts             pure helpers: INR formatting, dates, departure batches, validators
  pricing.js         price breakdown, booking ids and limits, shared with the server
  logic.test.ts      node:test suite for router.ts and lib.ts
  data/treks.ts      the 8 original treks, the Trek type and the destination tiles
  data/moreTreks.ts  the 20 treks added for the seed, with photo credits
  components/        Navbar, Footer, TrekCard
  screens/           one file per screen (19)
api/index.js         Vercel serverless entry: reuses one MongoDB connection, then hands off to the Express app
server/
  index.js           Express app: JSON body parsing, request log, routes, 404 and error handler
  models.js          Mongoose schemas: Trek, Booking, User, Review, LoginFailure
  routes.js          REST routes for /api/treks, /api/bookings, /api/users, /api/reviews, with per-role checks
  auth.js            password hashing, signed session tokens, authenticate and requireRole middleware
  seed.js            resets the database to the demo data (see Seed data)
  api.test.js        node:test integration tests against a real MongoDB
postman/             Postman collection for every endpoint
```

The stack is MongoDB, Express 5, React 19 and Node.js (MERN), with Mongoose 9, axios, react-router-dom 7, TypeScript, Vite 8 and Tailwind CSS v4.

Demo accounts (password `trek1234`): `rahul.kumar@example.com` (trekker), `operator@trekbazaar.in` (operator), `admin@trekbazaar.in` (admin; on a deployed copy its password is whatever `SEED_ADMIN_PASSWORD` was set to). Every other seeded account also uses `trek1234`; they are listed under [Seed data](#seed-data).

## Seed data

`npm run seed` deletes every trek, booking, user, review and login-failure record in the target database, then loads the data below. It gives the same result however many times it runs. Departure dates are worked out from the day it runs, so re-seed a long-lived copy now and then. **Do not point it at a database whose accounts you want to keep.**

| | Count | What it is |
|---|---|---|
| Treks | 28 | 8 from the original design (ids 1–8) and 20 added (ids 9–28), all real Indian treks. Each gets its next four departures on the 5th or 20th of an in-season month, 12 seats each |
| Operators | 9 | 8 verified fictional companies (`op1`–`op8`) and one awaiting verification (`op9`, Spiti Valley Hikers, no listings) |
| Trekkers | 13 | Fictional people (`u1`–`u13`). `u13` is suspended, to show that state in User Management |
| Admin | 1 | `admin@trekbazaar.in` |
| Bookings | 25 | 21 past trips (20 completed, 1 cancelled) and 4 upcoming (2 confirmed, 2 pending) placed on the trek's real scheduled departures |
| Reviews | 20 | One per completed trip, by the person who made it: 16 approved, 3 pending, 1 rejected (a spam example) |

Every person, company, booking and review is invented. All accounts except `operator@trekbazaar.in` and `admin@trekbazaar.in` use `@example.com` addresses, and every account's password is `trek1234` (the admin's is `SEED_ADMIN_PASSWORD` when set). The phone numbers are made up in the usual `+91 9xxxx xxxxx` mobile format; India has no range reserved for fiction, so they were not checked against real subscribers and should never be called or messaged. Prices and group sizes are demo values. The seed keeps to the API's own rules: each review is on a completed booking by its author, and each upcoming booking is on a scheduled departure.

Rahul Kumar (`rahul.kumar@example.com`) has a confirmed Roopkund trip, a pending Valley of Flowers request, a cancelled Hampta Pass trip, and completed (and reviewed) Kedarkantha and Triund trips. Himalayan Treks Co. (`operator@trekbazaar.in`, `op1`) owns Roopkund, Chadar, Har Ki Dun, Kedartal and Nag Tibba.

### Trek sources and photos

Each trek's facts (district, base village, maximum altitude, usual length, season) were checked against the source in the table: Wikipedia where it has an article on the trek, otherwise an operator's published itinerary (checked 2026-11-03; Indiahikes refuses automated requests, so it is not cited). Sources disagree on heights, and the seed uses the figure operators quote most often. Where Wikipedia gives a different height it is listed here: Roopkund (seed 5029 m, Wikipedia infobox 4536 m), Chandrashila (4000 m, 3690 m), Kedartal (4750 m, 5000 m), Bhrigu Lake (4300 m, 4235 m), and Goechala (4600 m, the usual turnaround at Viewpoint 1; Wikipedia gives 4940 m for the Goecha La pass itself).

Twenty-seven treks use a photo of that trek from Wikimedia Commons, shown with its credit under the trek page gallery. Each author and licence was checked against the file's Commons page on 2026-11-03, and each image was looked at to confirm it shows the trek. The images are loaded from `upload.wikimedia.org`, resized but otherwise unchanged.

| Id | Trek | Source | Photo | Author | Licence |
|---|---|---|---|---|---|
| 1 | Roopkund | [Roopkund](https://en.wikipedia.org/wiki/Roopkund) | [Roopkund - The Mystery Lake.jpg](https://commons.wikimedia.org/wiki/File:Roopkund_-_The_Mystery_Lake.jpg) | Shubhamrathod15 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 2 | Valley of Flowers | [Valley of Flowers National Park](https://en.wikipedia.org/wiki/Valley_of_Flowers_National_Park) | [Valley of flowers national park, Uttarakhand, India.jpg](https://commons.wikimedia.org/wiki/File:Valley_of_flowers_national_park,_Uttarakhand,_India.jpg) | Rohit Sharma | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 3 | Hampta Pass | [Hampta Pass](https://en.wikipedia.org/wiki/Hampta_Pass) | [Hampta Pass Himachal Pradesh India.jpg](https://commons.wikimedia.org/wiki/File:Hampta_Pass_Himachal_Pradesh_India.jpg) | Raja Selvaraj | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| 4 | Chadar | [Chadar trek](https://en.wikipedia.org/wiki/Chadar_trek) | [Chadar-Zanskar.jpg](https://commons.wikimedia.org/wiki/File:Chadar-Zanskar.jpg) | Atulbhats | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 5 | Kedarkantha | [Kedarkantha](https://en.wikipedia.org/wiki/Kedarkantha) | [Kedarkantha Peak.jpg](https://commons.wikimedia.org/wiki/File:Kedarkantha_Peak.jpg) | Kanthi Kiran | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 6 | Dzukou Valley | [Dzükou Valley](https://en.wikipedia.org/wiki/Dz%C3%BCkou_Valley) | [Breathtaking beauty of Dzukou Valley in Manipur-Nagaland border (edit).jpg](https://commons.wikimedia.org/wiki/File:Breathtaking_beauty_of_Dzukou_Valley_in_Manipur-Nagaland_border_%28edit%29.jpg) | Samudra Bikash Hazarika, edited by UnpetitproleX | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 7 | Sandakphu | [Sandakphu](https://en.wikipedia.org/wiki/Sandakphu) | [A VIEW OF MT.KANCHANJUNGA FROM SANDAKPHU.jpg](https://commons.wikimedia.org/wiki/File:A_VIEW_OF_MT.KANCHANJUNGA_FROM_SANDAKPHU.jpg) | Rajat63ghosh | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 8 | Triund | [Triund](https://en.wikipedia.org/wiki/Triund) | [Triund Hill.jpg](https://commons.wikimedia.org/wiki/File:Triund_Hill.jpg) | Alok Kumar | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 9 | Brahmatal | [Himalaya Shelter](https://himalayashelter.com/trek/brahmatal-trek/) | [Brahmatal.jpg](https://commons.wikimedia.org/wiki/File:Brahmatal.jpg) | Arijit95jitu | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 10 | Kuari Pass | [Explurger](https://blog.explurger.com/kuari-pass-trek/) | [Kuari Pass Bugyal.jpg](https://commons.wikimedia.org/wiki/File:Kuari_Pass_Bugyal.jpg) | Vaibhav78545 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 11 | Dayara Bugyal | [Dayara Bugyal](https://en.wikipedia.org/wiki/Dayara_Bugyal) | [Dayara Bugyal.jpg](https://commons.wikimedia.org/wiki/File:Dayara_Bugyal.jpg) | Vaibhav78545 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 12 | Har Ki Dun | [Har Ki Doon](https://en.wikipedia.org/wiki/Har_Ki_Doon) | [Har Ki Dun.jpg](https://commons.wikimedia.org/wiki/File:Har_Ki_Dun.jpg) | Metanish | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 13 | Chandrashila via Tungnath | [Chandrashila](https://en.wikipedia.org/wiki/Chandrashila) | [AjitHota-ChandrasilaPeak.jpg](https://commons.wikimedia.org/wiki/File:AjitHota-ChandrasilaPeak.jpg) | AjitK332 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 14 | Kedartal | [Kedartal](https://en.wikipedia.org/wiki/Kedartal) | [Kedartal.jpg](https://commons.wikimedia.org/wiki/File:Kedartal.jpg) | Peter Andersen | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| 15 | Nag Tibba | [Nag Tibba](https://en.wikipedia.org/wiki/Nag_Tibba) | [Nag Tibba 02.jpg](https://commons.wikimedia.org/wiki/File:Nag_Tibba_02.jpg) | Bhuwan Mahajan | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 16 | Pangarchulla Peak | [Himalaya Shelter](https://www.himalayashelter.com/trek/pangarchulla-trek) | [Pangarchulla Peak.jpg](https://commons.wikimedia.org/wiki/File:Pangarchulla_Peak.jpg) | ShwethaSulegai | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 17 | Bhrigu Lake | [Bhrigu Lake](https://en.wikipedia.org/wiki/Bhrigu_Lake) | [Brighu Lake.jpg](https://commons.wikimedia.org/wiki/File:Brighu_Lake.jpg) | DarthTang | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| 18 | Buran Ghati | [Bikat Adventures](https://www.bikatadventures.com/Home/Itinerary_io/buran-ghati-trek) | stock fallback (Himachal Pradesh) |  |  |
| 19 | Rupin Pass | [Rupin Pass](https://en.wikipedia.org/wiki/Rupin_Pass) | [Rupin Pass - View towards Sangla Valley.jpg](https://commons.wikimedia.org/wiki/File:Rupin_Pass_-_View_towards_Sangla_Valley.jpg) | Engti | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| 20 | Prashar Lake | [Prashar Lake](https://en.wikipedia.org/wiki/Prashar_Lake) | [Prashar Lake and temple ,Mandi ,Himachal Pardesh.jpg](https://commons.wikimedia.org/wiki/File:Prashar_Lake_and_temple_,Mandi_,Himachal_Pardesh.jpg) | Harvinder Chandigarh | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 21 | Kheerganga | [Khirganga National Park](https://en.wikipedia.org/wiki/Khirganga_National_Park) | [Kheerganga is a pious hot water spring Himachal India.jpg](https://commons.wikimedia.org/wiki/File:Kheerganga_is_a_pious_hot_water_spring_Himachal_India.jpg) | Photos Worldwide | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| 22 | Beas Kund | [Bikat Adventures](https://www.bikatadventures.com/Home/Itinerary/Beas-kund-trek) | [Beas kund.jpg](https://commons.wikimedia.org/wiki/File:Beas_kund.jpg) | Gaurav Dhingra | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 23 | Indrahar Pass | [Indrahar Pass](https://en.wikipedia.org/wiki/Indrahar_Pass) | [Looking up to the Indrahar Pass (22356846090).jpg](https://commons.wikimedia.org/wiki/File:Looking_up_to_the_Indrahar_Pass_%2822356846090%29.jpg) | Ashish Gupta from Noida, India | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| 24 | Markha Valley | [Markha River](https://en.wikipedia.org/wiki/Markha_River_%28India%29) | [Markha Valley1.JPG](https://commons.wikimedia.org/wiki/File:Markha_Valley1.JPG) | SlartibErtfass der bertige | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| 25 | Kashmir Great Lakes | [Kashmir Great Lakes Trek](https://en.wikipedia.org/wiki/Kashmir_Great_Lakes_Trek) | [Vishansar lake2.jpg](https://commons.wikimedia.org/wiki/File:Vishansar_lake2.jpg) | Mehrajmir13 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| 26 | Tarsar Marsar | [Tarsar Lake](https://en.wikipedia.org/wiki/Tarsar_Lake) | [Tarsar lake Aru.jpg](https://commons.wikimedia.org/wiki/File:Tarsar_lake_Aru.jpg) | Irfanaru | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| 27 | Goechala | [Goecha La](https://en.wikipedia.org/wiki/Goecha_La) | [Goechala pass - panoramio.jpg](https://commons.wikimedia.org/wiki/File:Goechala_pass_-_panoramio.jpg) | blackseav | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| 28 | Dzongri | [Himalaya Shelter](https://himalayashelter.com/trek/Dzongri-Trek) | [Mt. Kabru(south & North),Kabru Dome & Mt. Kangchenjunga from Dzongri view point DSC03985.jpg](https://commons.wikimedia.org/wiki/File:Mt._Kabru%28south_%26_North%29,Kabru_Dome_%26_Mt._Kangchenjunga_from_Dzongri_view_point_DSC03985.jpg) | Anupam2015 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

**Stock-photo fallback.** Buran Ghati has no usable photo on Commons, so it reuses the Unsplash photo of Himachal Pradesh from the Explore destination tiles (Unsplash Licence). Its credit line says "Stock photo of Himachal Pradesh, not of this trek" so nobody takes it for a picture of that trail. The destination tiles and the landing, login and sign-up backgrounds are also Unsplash photos; they illustrate a state or a mood, not a particular trek.

## API

Send `Authorization: Bearer <token>` with the token returned by register or login. Tokens last 8 hours. The role is read from the database on every request, so a role change applies at once.

| Method | Endpoint | Who may call it |
|---|---|---|
| GET | `/api/treks`, `/api/treks/:id` | Anyone (`?state=`, `?difficulty=`, `?operatorId=`). Rating, review count and seats left are computed |
| POST | `/api/treks` | Verified operator (becomes the owner) or admin |
| PUT, DELETE | `/api/treks/:id` | The owning operator or an admin; DELETE is 409 while bookings are active |
| GET | `/api/bookings`, `/api/bookings/:id` | Signed in: a trekker sees their own, an operator those on their treks, an admin all. Others' ids answer 404 |
| POST | `/api/bookings` | Trekker, on a scheduled departure with enough seats; the server sets the amount, owner and Pending status |
| PATCH | `/api/bookings/:id` | Trekker may cancel; operator and admin may confirm, cancel or complete |
| DELETE | `/api/bookings/:id` | Admin |
| POST | `/api/users/register` | Anyone; role `user` or `operator`, never `admin` |
| POST | `/api/users/login` | Anyone; 5 failed attempts per email lock it for 15 minutes |
| GET | `/api/users` | Admin |
| GET | `/api/users/me` | Signed in; the current account as stored |
| PUT | `/api/users/:id` | Yourself (name, phone, city, bio), or an admin; only an admin changes role, verification or suspension, and never on their own account |
| DELETE | `/api/users/:id` | Admin, never their own account |
| POST | `/api/users/me/password` | Signed in; needs `currentPassword`, wrong guesses count toward the login lockout |
| GET | `/api/reviews` | Anyone sees approved reviews (`?trekId=`); an admin sees all (`?status=`); `?mine=1` returns your own |
| POST | `/api/reviews` | Trekker with a completed booking on that trek, once per trek |
| PATCH | `/api/reviews/:id` | Admin; `Approved` or `Rejected` |

Request bodies are copied field by field, so a client cannot set ids, owners, ratings or Mongo operators such as `$unset`.

## Changes from the original design

The visual identity is kept as it was: forest-green palette, DM Serif Display headings, card layouts, and the emoji used as icons. The main changes:

- Replaced the floating "20 screens" demo navigator with real navigation. Each role's screens need a signed-in account of that role.
- Booking dates were hardcoded to 2025. Departures are now generated relative to today.
- The confirmation page showed a fixed Roopkund booking whatever you had booked. It now shows the booking you just made.
- The wishlist was separate state on each screen. It is now shared and persisted.
- The Explore filter sidebar was a component defined inside render, so it remounted on every keystroke and broke dragging the price slider. Fixed.
- Removed the Figma Make tooling (`.figma/`, its Vite plugins, the oxfmt formatter).



 The UI design comes from a Figma Make export.
