<template>
    <div id="home" v-if="ready">
        <Dashboard :key="dashKey" />
        <Chart v-bind:chart-type="chartType" v-bind:active-states="activeStates" :key="chartKey" />
        <footer class="footer">
            <div class="container">
                <p>By <a href="https://twitter.com/eugsun">@eugsun</a></p>
                <p>Data provided by <a href="https://covidtracking.com">The COVID Tracking Project</a></p>
                <p><a href="https://github.com/eugsun/covid19">Source</a></p>
            </div>
        </footer>
    </div>
</template>

<script>
 import Dashboard from '@/components/Dashboard'
 import Chart from '@/components/Chart'

 export default {
     name: 'App',
     props: ["chartType", "activeStates"],
     data: () => ({
         ready: false
     }),
     computed: {
         dashKey: function () {
             let datasets = this.$store.state.chartData.datasets ?? []
             let numSelectedStates = this.$store.state.selectedStates.size
             return `dash:${datasets.length}:${numSelectedStates}`
         },
         chartKey: function () {
             let datasets = this.$store.state.chartData.datasets ?? []
             return `chart:${datasets.length}`
         }
     },
     components: {
         Dashboard, Chart
     },
     mounted () {
         this.$store.dispatch("retrieveUSData").then(() => {
             this.$store.dispatch("retrieveStatesData");
         }).then(() => {
             this.ready = true;
         });
     }
 }
</script>

<style lang="scss">
 @import "~bulma/bulma";

 #app {
     font-family: Avenir, Helvetica, Arial, sans-serif;
 }
</style>
