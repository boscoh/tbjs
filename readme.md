# TB Model JS

This is interactive model of a compartmental model of Tuberculosis.

<http://pandemic.org.au/tb>

## Install

This is a Javascript Single-Page-Application, which is compiled to a static web-page that can be opened anywhere, even on your local file-system.

Download, and decompress:

  &nbsp; &nbsp; <https://github.com/emmamcbryde/tbjs/archive/master.zip>
 
The app needs to be compiled in the [`node.js`](https://nodejs.org/en/) ecosystem, using the default [ `npm` ](https://www.npmjs.com/) package-manager.

First install all the libraries:

    npm install

Then build the client to the `dist` directory for production
with minification:

    npm run build

This can then be opened as a static file in `dist/index.html`

## Development

During development, a hot-reloading version can be run on `http://localhost:8080`:

    npm run dev

## Modifying the model

The app is written in the Vue framework using the [PlasticGui](https://github.com/boscoh/plasticgui) template.

### Program flow

1. The entry point is the `index.html` file.
2. `index.html` will open `src/main.js`
3. `src/main.js` will set up Vue and load the Vue app.
4. Vue looks for the home page in `src/components/Home.vue`.
5. The models are loaded from there, where the TB model is in `src/modules/epi-models.js`.

### How to add compartments

In the file `src/modules/epi-models`, line 11, add compartments to `this.compartment`, which is identified by a name which is a string in camelCase.

### How to add flows

If the flow is only proportional between two compartments, a flow is added by `this.paramEvents.push(['compartmentFrom', 'compartmentTo', 'nameOfProportional])`. then a parameter needs to be entered into `this.defaultParams['nameOfProportional'] = <some value>`

If the flow is a dynamic transmission, then a flow is added by `this.varEvents.push(['compartmentFrom', 'compartmentTo', 'nameOfProportional])`. The dynamic parameter must be calculated in `calcVars`, where there are several examples of dynamic paramters.

### How to add inputs

The GUI reads the controls from the structure `this.guiParams`. You can allow any parameters in `this.defaultParams` to be adjusted by adding an entry to `this.guiParams`.

### How to add interventions

This is very similar to above, where values for interventions are added to `this.interventionParams` which has the same structure to `this.guiParams`

### About page

The content of the About page is found in `src/pages/About.vue` as
a Vue template that contains the HTML. Images are stored in `static`.

## Authors

Model created by Emma McBryde.

Programming by Bosco Ho <http://boscoh.com>
