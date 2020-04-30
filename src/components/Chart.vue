<template>
    <section id="chart">
        <div class="container">
            <div class="columns">
                <div class="column is-two-thirds">
                    <div class="panel">
                        <div class="panel-tabs">
                            <a v-bind:class="{ 'is-active': isChart('tests') }" v-on:click="setChart('tests')">Tests</a>
                            <a v-bind:class="{ 'is-active': isChart('cases') }" v-on:click="setChart('cases')">Positive Cases</a>
                            <a v-bind:class="{ 'is-active': isChart('deaths') }" v-on:click="setChart('deaths')">Deaths</a>
                        </div>
                        <div id="chart-control">
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
                        <div>
                            <LineChart
                                :chart-data="chartData"
                                :options="options"
                                :height="500"
                            />
                        </div>
                    </div>
                </div>
                <div class="column is-one-third">
                    <div class="panel" >
                        <div class="panel-block">
                            <input class="input is-primary" type="text" placeholder="Search State" v-model="autocompleteState" />
                        </div>
                        <div id="state-selection">
                            <a class="panel-block columns" v-on:click="toggleHidden(index)"
                               v-for="(state, index) in availableStates" :key="index">
                                <span class="column is-two-thirds">{{ getStateName(state.label) }} ({{ state.label }})</span>
                                <span class="column is-one-third has-text-right">
                                    <div v-if="!state.hidden">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </section>
</template>

<script>
 import LineChart from "@/components/LineChart.js"
 import USStates from "@/utils/USStates.js"

 export default {
     name: 'Chart',
     props: ["chartType", "activeStates"],
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
             l.sort((a, b) => a.label > b.label)
             l.sort((a, b) => a.hidden > b.hidden)
             return l
         },
         selectedChart: function () {
             const chartType = this.$store.state.chartType
             switch (chartType) {
                 case "totalTestResultsIncrease":
                     return "tests"
                 case "positveIncrease":
                     return "cases"
                 case "deathIncrease":
                     return "deaths"
                 default:
                     return "cases"
             }
         }
     },
     data: function () {
         let app = this;
         return {
             autocompleteState: "",
             filterStateMap: new Map(),
             loaded: false,
             lookbackDays: 30,
             movingAvgDays: 7,
             options: {
                 title: {
                     display: false,
                 },
                 maintainAspectRatio: false,
                 legend: {
                     display: false,
                 },
                 tooltips: {
                     mode: 'index',
                     intersect: false,
                     callbacks: {
                         label: function(tooltipItem, data) {
                             var label = data.datasets[tooltipItem.datasetIndex].label || '';
                             if (label) {
                                 label += ': ';
                             }
                             label += Math.round(tooltipItem.yLabel * 100) / 100;
                             app.$store.dispatch("setSnapshotForLabel",
                                                 {date: tooltipItem.xLabel,
                                                  label: data.datasets[tooltipItem.datasetIndex].label})
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
             let label = this.availableStates[index].label

             // URL edit
             let activeStates = this.activeStates;
             if (this.availableStates[index].hidden === true) {
                 // Show
                 if (!activeStates.includes(label)) {
                     activeStates += activeStates.length > 0 ? `,${label}` : label
                 }
             } else {
                 // Hide
                 activeStates = activeStates.replace(label, "").replace(",,", ",").replace(/^,|,$/g, "")
             }
             this.$router.push({ query: { chartType: this.chartType, activeStates: activeStates} })

             // State edit
             this.$store.dispatch("toggleStateHidden", {
                 label: label, isHidden: !this.availableStates[index].hidden
             });
             this.autocompleteState = "";
         },
         filterStates: function (autocompleteState) {
             this.availableStates.forEach((state) => {
                 if (state.label.includes(autocompleteState)) {
                     this.filterStateMap.set(state.label, true);
                 }
             });
         },
         getStateName: function (abbrev) {
             return USStates[abbrev];
         },
         setChart: function (chartType) {
             this.$store.dispatch("setChartType", chartType)
             this.$router.push({ query: { chartType: chartType, activeStates: this.activeStates } })
         },
         isChart: function (chartType) {
             return this.selectedChart === chartType
         }
     },
     mounted () {
         this.$store.dispatch("setChartType", this.chartType)
         if (this.activeStates) {
             this.activeStates.split(",").forEach((state) => {
                 if (state.length == 2 || state.length == 3) {
                     this.$store.dispatch("toggleStateHidden", {
                         label: state, isHidden: false
                     });
                 }
             })
         }
     }
 }
</script>

<style scoped>
 #state-selection {
     height: 40rem;
     overflow-y: scroll;
     overflow-x: hidden;
 }

 #chart-control {
     padding: 1rem 0;
 }
</style>
