# CLAUDE.md

## Projekto tikslas

Šis produktas nėra bendras „AI art studio“. Pagrindinis produkto use case:

**Iš spalvotos nuotraukos ar paveikslėlio sukurti spalvinimui paruoštą rezultatą, kurį vartotojas gali:**
1. atsispausdinti,
2. atsisiųsti,
3. nuspalvinti pačioje aplikacijoje.

Pirminė kryptis: **paprastas ir aiškus photo-to-coloring-page produktas**, o ne sudėtingas profesionalus kūrybinis editorius.

---

## Pagrindiniai produkto principai

Priimant bet kokį UI, UX ar architektūros sprendimą, laikytis šių principų:

1. **Aiškumas svarbiau už funkcijų kiekį**
   - Vartotojas per 3 sekundes turi suprasti, ką ši aplikacija daro.
   - Pirmas ekranas turi komunikuoti aiškų pažadą, ne techninę sistemą.

2. **Pirmas rezultatas kuo greičiau**
   - Kuo mažiau žingsnių iki pirmo sugeneruoto coloring page.
   - Jokie advanced nustatymai neturi trukdyti pirmajam rezultatui.

3. **Basic mode yra default**
   - Naujas vartotojas turi matyti tik būtiniausius veiksmus.
   - Visi advanced controls turi būti paslėpti po „Advanced settings“ ar atskiru režimu.

4. **Produktas turi būti suprantamas tėvams ir mokytojams**
   - Vengti pernelyg techninių terminų.
   - Žodynas turi būti paprastas, aiškus ir orientuotas į naudą.

5. **Rezultatas svarbiau už editoriaus įspūdį**
   - Reikia rodyti transformaciją: original image -> coloring page.
   - Print / Download / Color now turi būti akivaizdžiausi veiksmai po generavimo.

---

## Dabartinės problemos, kurias reikia taisyti

### 1. Per daug „studio / pro tool“ pozicionavimo
Dabartiniai terminai kaip:
- AI Art Studio
- Pro Studio
- Studio Engine
- Pigment Library
- Tool Dynamics
- Mastering

kuria įspūdį, kad tai sudėtingas dizaino įrankis.

**Kryptis:** perkelti produktą į aiškesnę kategoriją:
- Photo to Coloring Page
- Printable Coloring Page Creator
- Turn Photos into Coloring Pages

### 2. Per daug controls prieš pirmą vertę
Dabartinis interfeisas rodo per daug nustatymų prieš pirmą rezultatą:
- resolution
- raster/vector
- pigment library
- style library
- tool dynamics

**Kryptis:** palikti tik pagrindinius veiksmus pirmame flow.

### 3. Blogas pirmo ekrano pasirinkimas
`Blank Canvas` neturėtų būti vienas iš dviejų svarbiausių CTA, jei pagrindinis use case yra nuotraukos pavertimas coloring page.

**Kryptis:** keisti į:
- Upload Photo
- Try Demo

### 4. Eksporto logika per mažai aiški
`Export` yra per bendras terminas.

**Kryptis:** aiškūs veiksmai:
- Download PDF
- Download PNG
- Print Coloring Page
- Color in App

---

## Privalomas darbo būdas keičiant kodą

Kai daromi pakeitimai, visada laikytis šios sekos:

1. Pirma suprasti esamą komponentą ar srautą.
2. Tik tada siūlyti pakeitimą.
3. Nedaryti masinių refaktoringų vienu metu be aiškios priežasties.
4. Keisti mažais, testuojamais etapais.
5. Po kiekvieno pakeitimo patikrinti:
   - ar app vis dar buildinasi,
   - ar pagrindinis flow veikia,
   - ar nebuvo sugadintas import / generate / export kelias.

Jei daromas didesnis pakeitimas:
- pirmiausia aprašyti planą,
- tada atlikti pakeitimą,
- tada trumpai aprašyti, kas tiksliai pasikeitė.

---

## Prioritetai programavimui

### P0 — kritinis prioritetas
Tai darbai, kurie turi didžiausią įtaką produkto aiškumui ir testavimui.

1. **Perrašyti pirmą ekraną**
   - Pakeisti neaiškų positioningą.
   - Pagrindinė antraštė turi aiškiai sakyti, ką produktas daro.
   - CTA:
     - Upload Photo
     - Try Demo

2. **Padaryti Basic Mode kaip default**
   - Naujas vartotojas neturi matyti sudėtingų controls.
   - Advanced settings perkelti į collapse / modal / drawer.

3. **Supaprastinti terminus**
   - Keisti techninius UI pavadinimus į vartotojui suprantamus.

4. **Padaryti aiškų post-generation veiksmų rinkinį**
   - Print
   - Download PDF
   - Download PNG
   - Color in App

5. **Auto-fit sugeneruotą rezultatą**
   - Po generavimo paveikslas turi būti matomas didelis ir centre.
   - Vengti situacijos, kai vartotojas mato mažą rezultatą daug tuščios erdvės fone.

### P1 — aukštas prioritetas
1. **Try Demo flow**
   - Vartotojas gali išbandyti app be savo nuotraukos.
   - Įdėti kelis sample images.

2. **Before / After peržiūra**
   - Rodyti originalą ir rezultatą aiškiau.
   - Gali būti split view, toggle arba preview modal.

3. **Aiškesnė eksporto struktūra**
   - PDF spausdinimui
   - PNG skaitmeniniam naudojimui

4. **Feedback surinkimas**
   - Po sėkmingo naudojimo rodyti kvietimą palikti feedback.

5. **Event tracking**
   Trackinti bent šiuos eventus:
   - landing_view
   - upload_click
   - photo_uploaded
   - generate_started
   - generate_success
   - generate_failed
   - print_clicked
   - pdf_download_clicked
   - png_download_clicked
   - color_in_app_clicked

### P2 — vidutinis prioritetas
1. Advanced mode atskyrimas
2. Sample template kategorijos
3. Onboarding hints
4. Pricing / credits eksperimento paruošimas
5. Better mobile / tablet adaptacija, jei reikia

---

## UX kryptis

### Pirmas ekranas turi komunikuoti:
**Turn any photo into a coloring page in seconds**

Galimos subheadline kryptys:
- Upload a photo and get a printable coloring page instantly.
- Create personalized coloring pages for kids, teachers, and creative activities.

### Pagrindiniai CTA:
- Upload Photo
- Try Demo

### Ko neturi būti pirmame plane:
- per daug techninių terminų,
- advanced controls,
- „studio engine“ tipo abstrakcijos,
- blank canvas kaip pagrindinis CTA.

---

## Basic Mode struktūra

Basic mode turi turėti tik tai:

1. Upload Photo
2. Generate Coloring Page
3. Simple control:
   - Simpler lines
   - More detail
4. Output veiksmai:
   - Print
   - Download PDF
   - Download PNG
   - Color in App

Visa kita — į Advanced.

---

## Advanced Mode struktūra

Advanced mode gali turėti:
- resolution
- raster / vector
- line sensitivity
- style presets
- palette controls
- detailed export options

Bet advanced mode neturi būti pagrindinis naujo vartotojo kelias.

---

## Komponentų ir architektūros taisyklės

### Failų struktūros kryptis
Jei įmanoma, laikytis tokios loginės struktūros:

- `src/`
- `components/`
- `features/upload/`
- `features/generation/`
- `features/export/`
- `features/coloring/`
- `features/settings/`
- `lib/`
- `services/`
- `hooks/`
- `utils/`

### Komponentų taisyklės
1. Nedaryti milžiniškų komponentų.
2. Vienas komponentas = viena aiški atsakomybė.
3. UI ir business logic, kiek įmanoma, atskirti.
4. Export logiką laikyti atskirai nuo editoriaus UI.
5. Sample/demo logiką laikyti atskirai nuo realaus upload flow.

### State valdymo taisyklės
1. Aiškiai atskirti:
   - upload state,
   - generation state,
   - result state,
   - export state,
   - UI mode state.
2. Vengti „viskas viename komponente“ modelio.
3. Klaidas rodyti aiškiai ir suprantamai vartotojui.

---

## Terminų keitimo gairės

Jei randami šie terminai, svarstyti keitimą:

- `AI Art Studio` -> `Photo to Coloring Page`
- `Pro Studio` -> pašalinti arba paslėpti
- `Studio Engine` -> `Processing`
- `Pigment Library` -> `Colors`
- `Mastering` -> `Output Type` arba pašalinti
- `Tool Dynamics` -> `Advanced Settings`
- `Import` -> `Upload Photo`
- `Export` -> `Download PDF` / `Download PNG`

Ne visi pervadinimai turi būti mechaniniai. Tikslas — kalbėti naudotojo kalba.

---

## Testavimo taisyklės

Po kiekvieno reikšmingo pakeitimo patikrinti bent šiuos scenarijus:

1. Landing screen kraunasi be klaidų.
2. Veikia `Upload Photo`.
3. Nuotrauka sėkmingai apdorojama.
4. Sugeneruotas rezultatas rodomas aiškiai.
5. Veikia Print.
6. Veikia Download.
7. Veikia Color in App, jei ši funkcija aktyvi.
8. Klaidos scenarijus rodomas suprantamai, jei generavimas nepavyksta.

---

## Ko nedaryti

1. Neperrašyti viso produkto vienu kartu.
2. Neoptimizuoti smulkmenų prieš sutvarkant pagrindinį user flow.
3. Nepradėti nuo kosmetinių detalių, jei neaiškus pirmas ekranas.
4. Negrąžinti advanced controls į default view.
5. Nenaudoti techniškai skambančios kalbos ten, kur reikia aiškios naudos.

---

## Claude darbo instrukcija

Kai dirbi su šiuo projektu:

1. Visada galvok produkto, ne tik kodo kategorijomis.
2. Siūlyk pakeitimus, kurie mažina friction iki pirmo rezultato.
3. Prioritetą teik:
   - aiškumui,
   - greičiui,
   - konversijai,
   - paprastam onboardingui.
4. Jei siūlai didesnį refaktoringą, pirmiausia paaiškink:
   - ką keiti,
   - kodėl keiti,
   - kokį poveikį tai turės.
5. Jei matai konfliktą tarp „gražesnio studio“ ir „aiškesnio produkto“, rinkis aiškesnį produktą.
6. Jei neaišku, kaip pavadinti elementą, rinkis paprastesnę, ne techninę kalbą.
7. Kiekvieną reikšmingą UX sprendimą vertink pagal klausimą:
   **Ar naujas vartotojas per 3 sekundes supras, ką čia daryti?**

---

## Artimiausias vykdymo planas

### 1 etapas — stabilizacija
- Paleisti projektą lokaliai
- Patikrinti env ir build
- Identifikuoti svarbiausius entry point komponentus
- Identifikuoti upload / generate / export srautą

### 2 etapas — pirmo ekrano refaktoringas
- Pakeisti hero tekstą
- Pakeisti CTA
- Išimti Blank Canvas iš pagrindinio flow
- Įdėti Try Demo

### 3 etapas — Basic / Advanced atskyrimas
- Paslėpti advanced controls
- Sukurti paprastą naujo vartotojo režimą

### 4 etapas — rezultatų ekranas
- Auto-fit result
- Aiškesni action buttons
- Download formatų aiškumas

### 5 etapas — analytics ir feedback
- Event tracking
- Feedback modal / form
- Conversion taškų matavimas

### 6 etapas — testuotojų paleidimas
- 10–20 pirmų vartotojų
- Stebėti kur stringa
- Iteruoti pagal realų naudojimą

---

## Sėkmės kriterijai

Pokyčiai laikomi sėkmingais, jei:
1. Naujas vartotojas be pagalbos supranta, ką daryti.
2. Pirmą rezultatą gauna greitai.
3. Supranta skirtumą tarp Print / Download / Color in App.
4. Mažiau žmonių atkrenta prieš pirmą sugeneravimą.
5. Daugiau žmonių pasiekia eksporto ar spausdinimo veiksmą.
