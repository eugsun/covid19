<template>
    <section id="chart" v-if="ready">
        <div class="container">
            <div class="columns">
                <div class="column is-9">
                    <div class="panel">
                        <div class="panel-tabs">
                            <a v-bind:class="{ 'is-active': isChart('tests') }" v-on:click="setChart('tests')">Tests</a>
                            <a v-bind:class="{ 'is-active': isChart('cases') }" v-on:click="setChart('cases')">Positive Cases</a>
                            <a v-bind:class="{ 'is-active': isChart('deaths') }" v-on:click="setChart('deaths')">Deaths</a>
                        </div>
                        <div id="chart-control">
                            <div class="columns is-vcentered is-centered">
                                <div class="column">
                                    <label class="radio" for="compareMode">
                                        <input type="radio" id="compareMode" value="compare" v-model="displayMode">
                                        Compare Mode
                                    </label>
                                    <br>
                                    <label class="radio" for="combineMode">
                                        <input type="radio" id="combineMode" value="combine" v-model="displayMode">
                                        Combine Mode
                                    </label>
                                </div>
                                <div class="column has-text-centered">
                                    <p>Lookback Days: {{ lookbackDays }}</p>
                                    <p><input class="slider is-fullwidth is-info is-circle" type="range" min="7" max="60"
                                              v-model="lookbackDays"></p>
                                </div>
                                <div class="column has-text-centered">
                                    <p>Trailing Average Days: {{ movingAvgDays }}</p>
                                    <p><input class="slider is-fullwidth is-info is-circle" type="range" min="1" max="14"
                                              v-model="movingAvgDays"></p>
                                </div>
                                <div class="column has-text-right">
                                    <button class="button is-primary" v-on:click="render">Update</button>
                                </div>
                            </div>
                        </div>
                        <LineChart
                            :key="selectedStates.length"
                            :chart-data="chartData"
                            :options="options"
                            :height="500"/>
                    </div>
                </div>
                <div class="column is-3">
                    <div class="panel" >
                        <div class="panel-block">
                            <label class="checkbox">
                                <input type="checkbox" v-model="isUSSelected"/>
                            </label>
                            Show US Reference Line
                        </div>
                        <div class="panel-block">
                            <span>
                                <input v-model="numRegionStates" id="num-region-states"
                                       class="input" type="number" min="1" max="20"/>
                            </span>
                            <span class="select">
                                <select v-model="region">
                                    <option value="">States with =></option>
                                    <option value="high-test">Highest Test Coverage</option>
                                    <option value="low-test">Lowest Test Coverage</option>
                                    <option value="high-positive">Highest % Positive</option>
                                    <option value="low-positive">Lowest % Positive</option>
                                    <option value="high-death">Highest Death Rate</option>
                                    <option value="low-death">Lowest Death Rate</option>
                                </select>
                            </span>
                        </div>
                        <div class="panel-block">
                            <input class="input is-primary" type="text"
                                   placeholder="Search by State/Territory Name"
                                   v-model="autocompleteState"/>
                        </div>
                        <div id="state-selection">
                            <a class="panel-block columns" v-on:click="toggleHidden(index)"
                               v-for="(state, index) in availableStates" :key="index">
                                <span class="column is-two-thirds">
                                    {{ getStateName(state.label) }} ({{ state.label }})
                                </span>
                                <span class="column is-one-third has-text-right">
                                    <div v-if="selectedStates.includes(state.label)">
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
         ready: function () {
             return this.$store.state.chartReady
         },
         selectedStates: function () {
             return this.$store.state.selectedStates
         },
         chartData: function () {
             return this.$store.state.chartData
         },
         availableStates: function () {
             let l = Array.from(this.$store.state.dataset.states.values())
                          .filter((state) => {
                              const phrase = this.autocompleteState.toLowerCase()
                              return state.label.toLowerCase().includes(phrase)
                                  || this.getStateName(state.label).toLowerCase().includes(phrase)
                          })
             l.sort((a, b) => a.label > b.label)
             return l
         },
         selectedChart: function () {
             return this.$store.state.chartType
         },
         isUSSelected: {
             get () {
                 return this.$store.state.isUSSelected
             },
             set (value) {
                 this.$store.dispatch("toggleUSSelect", value)
             }
         },
         displayMode: {
             get () {
                 return this.$store.state.displayMode
             },
             set (value) {
                 this.$store.dispatch("setDisplayMode", value)
             }
         },
         numRegionStates: {
             get () {
                 return this.$store.state.numRegionStates
             },
             set (value) {
                 const region = this.$store.state.region
                 if (region.length > 0) {
                     this.$store.dispatch("setRegion", {region, numRegionStates: value}).then(() => {
                         this.$router.push({ query: { chartType: this.chartType,
                                                      activeStates: this.$store.state.selectedStates.join(",")} })
                     })
                 }
             }
         },
         region: {
             get () {
                 return this.$store.state.region
             },
             set (value) {
                 const numRegionStates = this.$store.state.numRegionStates
                 this.$store.dispatch("setRegion", {region: value, numRegionStates}).then(() => {
                     this.$router.push({ query: { chartType: this.chartType,
                                                  activeStates: this.$store.state.selectedStates.join(",")} })
                 })
             }
         },
     },
     data: function () {
         let app = this
         return {
             autocompleteState: "",
             filterStateMap: new Map(),
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
                     mode: "index",
                     intersect: false,
                     callbacks: {
                         label: function(tooltipItem, data) {
                             var label = data.datasets[tooltipItem.datasetIndex].label || ""
                             if (label === "") {
                                 return ""
                             }
                             label += ": " + (Math.round(tooltipItem.yLabel * 100) / 100).toString()
                             app.$store.dispatch("setSnapshotForLabel",
                                                 {date: tooltipItem.xLabel,
                                                  label: data.datasets[tooltipItem.datasetIndex].label})
                             return label
                         }
                     }
                 },
                 scales: {
                     xAxes: [{
                         display: true,
                         scaleLabel: {
                             display: true,
                             labelString: "Date",
                         }
                     }],
                     yAxes: [{
                         display: true,
                         scaleLabel: {
                             display: true,
                             labelString: "Growth Factor",
                         },
                         gridLines: {},
                         ticks: {
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
             let app = this
             this.$store.dispatch("updateChart", {
                 lookbackDays: app.lookbackDays,
                 movingAvgDays: app.movingAvgDays
             })
         },
         toggleHidden: function (index) {
             let label = this.availableStates[index].label
             const isHiddenNow = !this.selectedStates.includes(label)

             this.$store.dispatch("toggleStateHidden", {
                 label: label, isHidden: !isHiddenNow, refresh: true
             })

             let activeStates = this.activeStates
             if (isHiddenNow) {
                 // Show
                 if (!activeStates.includes(label)) {
                     activeStates += activeStates.length > 0 ? `,${label}` : label
                 }
             } else {
                 // Hide
                 activeStates = activeStates.replace(label, "").replace(",,", ",").replace(/^,|,$/g, "")
             }
             this.$router.push({ query: { chartType: this.chartType, activeStates: activeStates} })

             this.autocompleteState = ""
         },
         filterStates: function (autocompleteState) {
             this.availableStates.forEach((state) => {
                 if (state.label.includes(autocompleteState)) {
                     this.filterStateMap.set(state.label, true)
                 }
             })
         },
         getStateName: function (abbrev) {
             return USStates[abbrev]
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
         const activeStatesArray = this.activeStates.split(",")
         this.$store.dispatch("renderChart", {
             states: activeStatesArray,
             chartType: this.chartType,
             isUSSelected: this.isUSSelected
         })
     }
 }
</script>

<style scoped>
 #chart {
     margin-bottom: 2rem;
 }
 .select {
     max-width: 70%;
 }
 #num-region-states {
     min-width: 4rem;
 }
 #state-selection {
     height: 460px;
     overflow-y: scroll;
     overflow-x: hidden;
 }
 #chart-control {
     padding: 1rem 3rem;
 }
</style>
