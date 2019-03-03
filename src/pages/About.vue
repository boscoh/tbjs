<template>
  <v-container>
    <v-layout
      justify-center
      row
    >
      <v-flex
        xs10
        md6
        lg6
      >
        <h2 class="display-2 pt-4 pb-3">
          About
        </h2>

        <p style="padding-top: 2em">
          This is an app for exploring a basic compartmental model for TB.
        </p>

        <v-data-table
          :headers="headers"
          :items="definitions"
          class="elevation-1"
          hide-actions="false"
        >
          <template
            slot="items"
            slot-scope="props"
          >
            <td>
              <!-- eslint-disable-next-line -->
              <span v-html="props.item.symbol"></span>
            </td>
            <td class="text-xs-left">
              <!-- eslint-disable-next-line -->
              <span v-html="props.item.name"></span>
            </td>
          </template>
        </v-data-table>

        <p>
          <v-img src="static/diagram2.jpg"></v-img>
        </p>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  data () {
    return {
      headers: [
        {
          text: 'Symbol',
          align: 'left',
          sortable: false,
          value: 'symbol'
        },
        {
          text: 'Variable Name',
          sortable: false,
          value: 'name'
        }
      ],
      definitions: [
        {
          symbol: 'S',
          name: 'susceptible'
        },
        {
          symbol: 'S2',
          name: 'susceptibleRecovered'
        },
        {
          symbol: 'S2',
          name: 'susceptibleTreated'
        },
        {
          symbol: 'LA',
          name: 'latentEarly'
        },
        {
          symbol: 'LB',
          name: 'latentRemote'
        },
        {
          symbol: 'I',
          name: 'infectious'
        },
        {
          symbol: 'D<sub>x</sub>',
          name: 'diagnosed'
        },
        {
          symbol: 'T<sub>x</sub>',
          name: 'treated'
        },
        {
          symbol: 'death',
          name: 'dead'
        },
        {
          symbol: '&beta;',
          name: 'Contact Rate'
        },
        {
          symbol: '&beta;&#42;/&beta;',
          name: 'Relative Susceptibility for Recovered'
        },
        {
          symbol: '&beta;&#42;&#42;/&beta;',
          name: 'Relative Susceptibility for Treated'
        },
        {
          symbol: '&lambda;',
          name: 'Contact Rate'
        },
        {
          symbol: '&lambda;&#42;',
          name: 'Recovered Contact Rate'
        },
        {
          symbol: '&lambda;&#42;&#42;',
          name: 'Treated Contact Rate'
        },
        {
          symbol: 'N',
          name: 'total population'
        }
      ]
    }
  }
}
</script>
