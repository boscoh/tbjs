import _ from 'lodash'
import PopJs from './pop-js'

class TbModel extends PopJs {
  constructor (id) {
    super(id)
    this.id = id

    this.modelType = 'TB'

    this.compartment = {
      susceptible: 0,
      latentEarly: 0,
      latentRemote: 0,
      infectious: 0,
      diagnosed: 0,
      treated: 0,
      dead: 0,
      susceptiblePastInfection: 0
    }

    this.defaultParams = {
      initPopulation: 5000,
      initPrevalence: 300,
      beta: 5,
      betaAgain: 5,
      latentChangeRate: 1 / 100,
      infectionEarlyRate: 1.1 / 1000,
      infectionLateRate: 5.5 / 1000000,
      treatmentEarlyRate: 0,
      treatmentRemoteRate: 0,
      diagnosisRate: 1 / 365 / 3,
      toTreatementRate: 1 / 14,
      treatmentDuration: 182,
      activeTreatmentRate: 2 / 365,
      deathRate1: 1 / 365 / 3,
      deathRate2: 1 / 365 / 10
    }

    this.param = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'latentEarly', 'rateForce'])
    this.varEvents.push([
      'susceptiblePastInfection',
      'latentEarly',
      'rateForceAgain'
    ])

    this.paramEvents.push(['latentEarly', 'latentRemote', 'latentChangeRate'])
    this.paramEvents.push(['latentEarly', 'infectious', 'infectionEarlyRate'])
    this.paramEvents.push(['latentRemote', 'infectious', 'infectionLateRate'])

    this.paramEvents.push(['latentEarly', 'susceptible', 'treatmentEarlyRate'])
    this.paramEvents.push([
      'latentRemote',
      'susceptible',
      'treatmentRemoteRate'
    ])

    this.paramEvents.push(['infectious', 'diagnosed', 'diagnosisRate'])
    this.paramEvents.push(['diagnosed', 'treated', 'toTreatementRate'])
    this.paramEvents.push(['infectious', 'dead', 'deathRate1'])
    this.paramEvents.push(['treated', 'dead', 'deathRate2'])
    this.paramEvents.push([
      'treated',
      'susceptiblePastInfection',
      'activeTreatmentRate'
    ])

    this.guiParams = [
      {
        key: 'initPopulation',
        value: 5000,
        max: 100000,
        interval: 1,
        placeHolder: '',
        label: 'Population',
        decimal: 0
      },
      {
        key: 'initPrevalence',
        value: 300,
        max: 10000,
        interval: 1,
        placeHolder: '',
        label: 'Initial Prevalence',
        decimal: 0
      },
      {
        key: 'years',
        value: 100,
        max: 200,
        interval: 1,
        placeHolder: '',
        label: 'Years',
        decimal: 0
      },
      {
        key: 'betaPerYear',
        value: 10,
        interval: 1,
        placeHolder: '',
        max: 50,
        label: 'Contact Rate Per Year',
        decimal: 0
      },
      {
        key: 'betaRatio',
        value: 0.5,
        interval: 0.01,
        placeHolder: '',
        max: 2,
        label: 'Relative Susceptibility following TB',
        decimal: 2
      },
      {
        key: 'caseDetectionRate',
        value: 0.6,
        interval: 0.01,
        placeHolder: '',
        max: 1,
        label: 'Case Detection Rate',
        decimal: 1
      }
    ]

    this.interventionParams = [
      {
        key: 'interventionYear',
        value: 50,
        max: 200,
        interval: 1,
        placeHolder: '',
        label: 'Start Year',
        decimal: 0
      },
      {
        key: 'caseDetectionRate',
        value: 0.65,
        interval: 0.01,
        placeHolder: '',
        max: 1,
        label: 'Case Detection Rate',
        decimal: 1
      },
      {
        key: 'treatmentEarlyRateYear',
        value: 0.02,
        interval: 0.001,
        max: 0.2,
        placeHolder: '',
        label: 'Early Latent TB Treatment Rate Per Year',
        decimal: 3
      },
      {
        key: 'treatmentRemoteRateYear',
        value: 0.02,
        interval: 0.001,
        max: 0.2,
        placeHolder: '',
        label: 'Remote Latent TB Treatment Rate Per Year',
        decimal: 3
      },
      {
        key: 'treatmentSuccessRatio',
        value: 19 / 20,
        interval: 0.01,
        max: 1,
        placeHolder: '',
        label: 'Treatment Success Ratio',
        decimal: 2
      }
    ]
  }

  calcExtraParams () {
    this.param.beta = this.param.betaPerYear / 365
    this.param.betaAgain = this.param.betaRatio * this.param.beta
    this.param.diagnosisRate =
      (this.param.caseDetectionRate / (1 - this.param.caseDetectionRate)) *
      (1 / 365 / 3)

    // extra parameters available only to intervention
    if (_.has(this.param, 'treatmentSuccessRatio')) {
      this.param.deathRate2 =
        this.param.activeTreatmentRate / this.param.treatmentSuccessRatio -
        this.param.activeTreatmentRate
    }

    if (_.has(this.param, 'treatmentEarlyRateYear')) {
      this.param.treatmentEarlyRate = this.param.treatmentEarlyRateYear / 365
    }
    if (_.has(this.param, 'treatmentRemoteRateYear')) {
      this.param.treatmentRemoteRate = this.param.treatmentRemoteRateYear / 365
    }
  }

  calcVars () {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      (this.param.beta * this.compartment.infectious) / this.var.population
    this.var.rateForceAgain =
      (this.param.betaAgain * this.compartment.infectious) / this.var.population
  }

  calcDiagnosticVars () {
    this.var.prevalence =
      (this.compartment.infectious / this.var.population) * 100000
    this.var.incidence = 0
    this.var.mortality = 0
    for (let [, to, val] of this.events) {
      if (to === 'infectious') {
        this.var.incidence += val
      }
      if (to === 'dead') {
        this.var.mortality += val
      }
    }
    this.var.incidence =
      ((this.dTime * this.var.incidence) / this.var.population) * 100000
    this.var.mortality =
      ((this.dTime * this.var.mortality) / this.var.population) * 100000
  }
}

let epiModels = [
  {
    Class: TbModel,
    name: 'Tuberculosis'
  }
]

export { epiModels }
