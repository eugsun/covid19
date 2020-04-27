<template>
    <section id="chart">
        <div class="container" id="control">
            <div class="columns is-vcentered is-centered has-text-centered">
                <div class="column">
                    <p>Lookback Days: {{ lookbackDays }}</p>
                    <p><input class="slider is-fullwidth is-info is-circle" v-model="lookbackDays" type="range" min="7" max="60"></p>
                </div>
                <div class="column">
                    <p>Trailing Moving Average Days: {{ movingAvgDays }}</p>
                    <p><input class="slider is-fullwidth is-info is-circle" v-model="movingAvgDays" type="range" min="1" max="14"></p>
                </div>
                <div class="column">
                    <button class="button is-primary" v-on:click="render">Update</button>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="columns">
                <div class="column is-two-thirds">
                    <div>
                        <LineChart
                            :chart-data="chartData"
                            :options="options"
                            :height="500"
                        />
                    </div>
                </div>
                <div class="column is-one-third">
                    <div class="panel" >
                        <div class="panel-block">
                        <input class="input" type="text" name="State" v-model="autocompleteState" />
                        </div>
                        <a class="panel-block columns" v-on:click="toggleHidden(index)"
                           v-for="(state, index) in availableStates" :key="index">
                            <span class="column is-two-thirds">{{ getStateName(state.label) }} ({{ state.label }})</span>
                            <span class="column is-one-third has-text-right">{{ !state.hidden }}</span>
                        </a>
                    </div>
                </div>
            </div>

        </div>
    </section>
</template>

<script>
 import LineChart from "./LineChart.js"
 import US_STATES from "./USStates.js"

 export default {
     name: 'Chart',
     computed: {
         chartData: function () {
             return this.$store.state.chartData;
         },
         availableStates: function () {
             let l = Array.from(this.$store.state.datasetMap.values())
                          .filter((state) => {
                              const phrase = this.autocompleteState.toLowerCase()
                              return state.label.toLowerCase().includes(phrase)
                                  || this.getStateName(state.label).toLowerCase().includes(phrase)
                          })
             l.sort((a, b) => a.hidden > b.hidden)
             return l
         },
     },
     data: function () {
         return {
             autocompleteState: "",
             filterStateMap: new Map(),

             loaded: false,
             lookbackDays: 30,
             movingAvgDays: 7,
             options: {
                 title: {
                     display: true,
                     text: 'Growth Factor of Positive Cases by States',
                 },
                 maintainAspectRatio: false,
                 legend: {
                     display: false,
                 },
                 tooltips: {
                     mode: 'index',
                     callbacks: {
                         label: function(tooltipItem, data) {
                             var label = data.datasets[tooltipItem.datasetIndex].label || '';
                             if (label) {
                                 label += ': ';
                             }
                             label += Math.round(tooltipItem.yLabel * 100) / 100;
                             return label;
                         }
                     }
                 },
                 scales: {
                     xAxes: [{
                         display: true,
                         scaleLabel: {
                             display: true,
                             labelString: 'Date',
                         }
                     }],
                     yAxes: [{
                         display: true,
                         scaleLabel: {
                             display: true,
                             labelString: 'Growth Factor',
                         },
                         gridLines: {
                             // drawBorder: true,
                             // color: ['green']
                         },
                         ticks: {
                             // min: -1,
                             // max: 2,
                             stepSize: 0.1,
                         }
                     }],
                 },
             }
         }
     },
     components: {
         LineChart
     },
     methods: {
         render: function () {
             let app = this;
             this.$store.dispatch("updateChart", {
                 lookbackDays: app.lookbackDays,
                 movingAvgDays: app.movingAvgDays
             })
         },
         toggleHidden: function (index) {
             console.log(`${index} => ${this.availableStates[index].hidden}`)
             this.$store.dispatch("toggleStateHidden", {
                 label: this.availableStates[index].label
             });
         },
         filterStates: function (autocompleteState) {
             this.availableStates.forEach((state) => {
                 if (state.label.includes(autocompleteState)) {
                     this.filterStateMap.set(state.label, true);
                 }
             });
         },
         getStateName: function (abbrev) {
             return US_STATES[abbrev];
         }
     },
     mounted () {
     }
 }
</script>
