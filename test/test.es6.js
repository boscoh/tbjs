const _ = require('lodash')

import util from '../src/modules/util'
import { epiModels } from '../src/modules/epi-models'
import config from '../src/config'

let epiModel = epiModels[0]
let model = new epiModel.Class()

let dStepInDays = 2
let timeInDays = model.param.years * 365
let nStep = timeInDays / dStepInDays
console.log(`\n\nRunning ${epiModel.name} model`)
model.run(nStep, dStepInDays)

it('check solutions length', function() {
	let times = _.clone(model.times)
	for (let soln of _.values(model.solutions)) {
		assert(soln.length === times.length)
	}
})
