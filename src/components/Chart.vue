<template>
    <section id="chart">
        <div class="container" id="control">
            <div class="columns is-vcentered is-centered has-text-centered">
                <div class="column">
                    <p>Lookback days: {{ lookbackDays }}</p>
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
            <div>
                <LineChart
                    :chart-data="chartData"
                    :options="options"
                    :height="500"
                />
            </div>
        </div>
    </section>
</template>

<script>
 import LineChart from "./LineChart.js"

 export default {
     name: 'Chart',
     computed: {
         chartData: function () {
             return this.$store.state.chartData;
         }
     },
     data: function () {
         return {
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
                     position: 'bottom'
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
                             console.log(data);
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
                             min: 0,
                             // max: 3,
                             stepSize: 0.5,
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
         }
     },
     mounted () {
     }
 }
</script>
