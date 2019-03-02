<template>
  <v-container
    style="height: calc(100vh - 58px)"
    fluid
    grid-list-xl
  >
    <v-layout>
      <v-flex>
        <h2 class="display-1 pb-2">
          {{ title }}
        </h2>
      </v-flex>
    </v-layout>

    <v-layout row>
      <v-flex
        xs5
        md4
        lg3
      >
        <v-card
          style="
            height: calc(100vh - 180px);
            overflow: auto;"
        >
          <v-card-title class="headline">
            Parameters
          </v-card-title>

          <v-card-text>
            <div
              v-for="(param, i) of sliders"
              :key="i"
              style="text-align: left"
              column
            >
              {{ param.label }} =
              {{
                param.decimal ? param.value.toFixed(param.decimal) : param.value
              }}
              <v-slider
                v-model="param.value"
                :step="param.interval"
                :max="param.max"
                @callback="changeGraph()"
              ></v-slider>
            </div>
          </v-card-text>

          <v-card-title class="headline">
            Intervention
          </v-card-title>

          <v-card-text>
            <div
              v-for="(param, i) of interventionSliders"
              :key="i"
              style="text-align: left"
              column
            >
              {{ param.label }} =
              {{
                param.decimal ? param.value.toFixed(param.decimal) : param.value
              }}
              <v-slider
                v-model="param.value"
                :step="param.interval"
                :max="param.max"
                @callback="changeGraph()"
              ></v-slider>
            </div>
          </v-card-text>
        </v-card>
      </v-flex>

      <v-flex
        xs7
        md8
        lg9
      >
        <v-card
          style="
            height: calc(100vh - 180px);
            overflow: auto;"
        >
          <v-card-title class="headline">
            Graphs
          </v-card-title>

          <v-card-text>
            <div
              id="epi-charts"
              style="
                display: flex;
                flex-wrap: wrap"
            ></div>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<style>
.chart {
  height: 300px;
  width: 600px;
}
</style>

<script>
import util from '../modules/util'
import ChartWidget from '../modules/chart-widget'
import { epiModels } from '../modules/epi-models'
import $ from 'jquery'
import _ from 'lodash'
import config from '../config'

function sumLists (a, b) {
  return _.map(_.zip(a, b), x => x[0] + x[1])
}

function reversed (l) {
  let result = _.cloneDeep(l)
  result.reverse()
  return result
}

function acumulateValues (vals) {
  let result = []
  for (let i of _.range(vals.length)) {
    let val = _.sum(vals.slice(0, i + 1))
    result.push(val)
  }
  return result
}

class StackGraph {
  constructor (selector, title, xlabel, keys) {
    this.keys = keys
    this.chartWidget = new ChartWidget(selector)
    this.chartWidget.setTitle(title)
    this.chartWidget.setXLabel(xlabel)
    this.chartWidget.setYLabel('')
    for (let [i, key] of _.toPairs(keys)) {
      let color = this.chartWidget.defaultColors[i]
      this.chartWidget.addDataset(key, null, null, color)
    }
    let datasets = this.chartWidget.getDatasets()
    let n = datasets.length
    for (let i of _.range(n - 1)) {
      datasets[i].fill = i + 1
    }
    datasets[n - 1].fill = 'origin'
  }

  updateFromModel (model) {
    this.model = model
    let x = _.map(this.model.times, t => t / 365)
    let y
    for (let key of reversed(this.keys)) {
      let newY = this.model.solution[key]
      y = _.isNil(y) ? newY : sumLists(y, newY)
      this.chartWidget.updateDatasetByKey(key, x, y)
      this.chartWidget.getChartOptions().scales.xAxes[0].ticks.max = parseInt(
        _.max(x)
      )
    }
  }
}

class EndStackGraph {
  constructor (selector, title, xlabel, keys) {
    this.keys = keys
    this.chartWidget = new ChartWidget(selector)
    this.chartWidget.setTitle(title)
    this.chartWidget.setXLabel(xlabel)
    this.chartWidget.setYLabel('')
    for (let [i, key] of _.toPairs(keys)) {
      let color = this.chartWidget.defaultColors[i]
      this.chartWidget.addDataset(key, null, null, color)
    }
    let datasets = this.chartWidget.getDatasets()
    let n = datasets.length
    for (let i of _.range(n - 1)) {
      datasets[i].fill = i + 1
    }
    datasets[n - 1].fill = 'origin'
  }

  updateFromModel (model) {
    this.model = model
    let x = [0, 1]
    let y = null
    for (let key of reversed(this.keys)) {
      let lastY = _.last(this.model.solution[key])
      let newY = [lastY, lastY]
      y = _.isNil(y) ? newY : sumLists(y, newY)
      this.chartWidget.getChartOptions().scales.xAxes[0].ticks.stepSize = 1
      this.chartWidget.updateDatasetByKey(key, x, y)
    }
  }
}

class InterventionGraph {
  constructor (selector, title, xlabel, keys) {
    this.keys = keys
    this.chartWidget = new ChartWidget(selector)
    this.chartWidget.setTitle(title)
    this.chartWidget.setXLabel(xlabel)
    this.chartWidget.setYLabel('')
    for (let [i, key] of _.toPairs(keys)) {
      let color = this.chartWidget.defaultColors[i]
      this.chartWidget.addDataset(key, null, null, color)
      this.chartWidget.addDataset(
        key + '-intervention',
        null,
        null,
        color,
        true
      )
    }
  }

  updateFromModel (model, intervention) {
    this.model = model
    this.intervention = intervention
    let x, y
    for (let key of reversed(this.keys)) {
      x = _.map(this.model.times, t => t / 365)
      y = this.model.solution[key]
      this.chartWidget.updateDatasetByKey(key, x, y)
      this.chartWidget.getChartOptions().scales.xAxes[0].ticks.max = parseInt(
        _.max(x)
      )

      if (!_.isNil(intervention)) {
        x = _.map(this.intervention.times, t => t / 365)
        if (!_.has(this.intervention.solution, key)) {
          continue
        }
        y = this.intervention.solution[key]
        let k = key + '-intervention'
        this.chartWidget.updateDatasetByKey(k, x, y)
      } else {
        let k = key + '-intervention'
        this.chartWidget.updateDatasetByKey(k, [], [])
      }
    }
  }
}

export default {
  data () {
    return {
      title: config.title,
      sliders: [],
      interventionSliders: []
    }
  },
  watch: {
    sliders: {
      handler () {
        this.changeGraph()
      },
      deep: true
    },
    interventionSliders: {
      handler () {
        this.changeGraph()
      },
      deep: true
    }
  },
  async mounted () {
    let epiModel = epiModels[0]
    this.model = new epiModel.Class()
    this.dTimeInDay = 365 / 12

    util.copyArray(this.sliders, this.model.guiParams)
    util.copyArray(this.interventionSliders, this.model.interventionParams)

    this.charts = [
      {
        title: 'Compartments',
        divTag: 'compartment-chart',
        keys: _.keys(this.model.compartment),
        xlabel: 'time (years)',
        GraphClass: InterventionGraph
      },
      {
        title: 'Stacked Compartments',
        divTag: 'stack-compartment-chart',
        keys: _.keys(this.model.compartment),
        xlabel: 'time (years)',
        GraphClass: StackGraph
      },
      {
        title: 'Final Population Breakdown by Disease State',
        divTag: 'end-stack-compartment-chart',
        keys: _.keys(this.model.compartment),
        xlabel: '',
        GraphClass: EndStackGraph
      },
      {
        title: 'Low-valued Compartments',
        divTag: 'low-compartment-chart',
        keys: _.slice(_.keys(this.model.compartment), 5, 10),
        xlabel: 'time (years)',
        GraphClass: InterventionGraph
      },
      {
        title: 'Cumulative Inidence',
        divTag: 'cumul-incidence-chart',
        keys: ['cumulIncidence'],
        xlabel: 'time (years)',
        GraphClass: InterventionGraph
      },
      {
        title: 'Diagnostics Per 100000',
        divTag: 'diagnostics-chart',
        keys: ['prevalence', 'mortality', 'incidence'],
        xlabel: 'time (years)',
        GraphClass: InterventionGraph
      },
      {
        title: 'Final Diagnostics Per 100000',
        divTag: 'end-stack-diagnostics-chart',
        keys: ['prevalence', 'mortality', 'incidence'],
        xlabel: '',
        GraphClass: EndStackGraph
      }
    ]

    let $div = $('#epi-charts').empty()
    for (let chart of this.charts) {
      $div.append(
        $('<div>')
          .attr('id', chart.divTag)
          .addClass('chart')
      )
      chart.widget = new chart.GraphClass(
        `#${chart.divTag}`,
        chart.title,
        chart.xlabel,
        chart.keys
      )
    }
  },
  methods: {
    runModelAndIntervention () {
      this.model.clearSolutions()
      this.model.initCompartments()

      this.model.time = this.model.startTime
      this.model.times.push(this.model.time)
      this.model.saveToSolution(0)

      this.intervention = null
      _.times(this.nStep, iStep => {
        if (iStep === this.interventionStep) {
          this.intervention = _.cloneDeep(this.model)
        }
        this.model.clearDelta()
        this.model.integrateStep(this.dTimeInDay)
      })

      this.model.solution.cumulIncidence = acumulateValues(
        this.model.solution.incidence
      )

      if (!_.isNil(this.intervention)) {
        this.intervention.applyIntervention(this.interventionSliders)
        let nIntervention = this.nStep - this.interventionStep
        _.times(nIntervention, () => {
          this.intervention.clearDelta()
          this.intervention.integrateStep(this.dTimeInDay)
        })
        this.intervention.solution.cumulIncidence = acumulateValues(
          this.intervention.solution.incidence
        )
      }
    },
    convertYearToStep (year) {
      return parseInt((year * 365) / this.dTimeInDay)
    },
    changeGraph () {
      this.model.importGuiParams(this.sliders)
      let entry = _.find(
        this.interventionSliders,
        e => e.key === 'interventionYear'
      )
      this.interventionStep = entry ? this.convertYearToStep(entry.value) : null
      this.nStep = this.convertYearToStep(this.model.param.years)

      this.runModelAndIntervention()

      for (let chart of this.charts) {
        chart.widget.updateFromModel(this.model, this.intervention)
      }
    }
  }
}
</script>
