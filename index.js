//
// UTIL
//
function getRandomColorRgb() {
    let red = Math.floor(Math.random() * 256);
    let green = Math.floor(Math.random() * 256);
    let blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
}

//
// APP
//
let usCurrentApi = 'https://covidtracking.com/api/v1/us/current.json';
let api = 'https://covidtracking.com/api/states/daily';

let chart = Vue.component('line-chart', {
    extends: VueChartJs.Line,
    mixins: [VueChartJs.mixins.reactiveProp],
    props: {
        chartData: {
            type: Object,
            default: null
        },
        options: {
            type: Object,
            default: null
        }
    },
    mounted () {
        this.renderChart(this.chartData, this.options);
    }
});


let app = new Vue({
    el: '#app-chart',
    name: 'COVID-19 USA Growth Factor',
    components: {
        chart,
    },
    data: {
        loaded: false,
        chartData: null,
        options: null,
        movingAvgDays: 5,
        lookbackDays: 30,
        apiResult: null,
        labels: null,
        // Snapshot
        date: '-',
        usPopulation: 330579861,
        totalTests: '-',
        totalPositives: '-',
        totalDeaths: '-',
        percentTested: '-',
        percentPositive: '-',
        percentDead: '-',
    },
    methods: {
        render: function () {
            // this.movingAvgDays = Number(this.movingAvgDays);
            this.loaded = false;
            let labelSet = new Set();
            let datasetMap = new Map();
            this.apiResult.forEach(function(d) {
                labelSet.add(d.date);
                if (!datasetMap.has(d.state)) {
                    let stateColor = getRandomColorRgb();
                    datasetMap.set(d.state, {
                        label: d.state,
                        data: [],
                        metadata: new Map(),
                        borderColor: stateColor,
                        backgroundColor: stateColor,
                        hidden: d.state != "NY" && d.state != "MD",
                        fill: false,
                    })
                }
                // datasetMap.get(d.state).data.push(d.positiveIncrease);
                let metadata = datasetMap.get(d.state).metadata;
                metadata.set(d.date, {
                    positiveIncrease : d.positiveIncrease,
                    deathIncrease: d.deathIncrease,
                });
                // datasetMap.get(d.state).data.push(d.deathIncrease);
            });
            this.labels = Array.from(labelSet);
            this.labels.sort();

            let labels = this.labels;

            let datasets = Array.from(datasetMap.values());
            datasets.forEach(function(dataset) {
                // dataset.data.reverse();
                labels.forEach(function(dateLabel) {
                    if (dataset.metadata.has(dateLabel)) {
                        dataset.data.push(dataset.metadata.get(dateLabel).positiveIncrease);
                    } else {
                        dataset.data.push(0);
                    }
                });

                let originals = [0];
                let growthFactors = [1];
                let avgGrowthFactors = [];

                let prev = dataset.data[0];
                for (let i = 1; i < dataset.data.length; i++) {
                    originals.push(dataset.data[i]);

                    let transformed = prev < 0.1 ?
                        1 : dataset.data[i] * 1.0 / prev;
                    prev = dataset.data[i];
                    dataset.data[i] = transformed;
                    growthFactors.push(transformed);
                }
                let n = app.movingAvgDays;
                for (let i = 0; i < n; i++) {
                    avgGrowthFactors.push(1.0);
                }
                for (let i = n; i < growthFactors.length; i++) {
                    let sumOriginal = originals.slice(i-n, i)
                                               .reduce((a, b) => a+b, 0) / n;
                    let sumOriginalNow = originals.slice(i-n+1, i+1)
                                                  .reduce((a, b) => a+b, 0) / n;
                    let val = sumOriginalNow < 0.1 || sumOriginal < 0.1 ? 1 : sumOriginalNow / sumOriginal;
                    // console.log(`for ${i}: ${sumOriginal} => ${sumOriginalNow} Grew by ${val}`);
                    avgGrowthFactors.push(val);
                }
                // dataset.data = avgGrowthFactors;
                dataset.data = avgGrowthFactors.slice(
                    avgGrowthFactors.length - app.lookbackDays,
                    avgGrowthFactors.length);
            });
            this.chartData = {
                labels: labels.slice(labels.length - app.lookbackDays, labels.length),
                datasets: datasets,
            };
            this.options = {
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
            };
            this.loaded = true;
        },
        renderSnapshot: function () {
            this.loaded = false;

            let totalTests = this.usSnapshot.totalTestResults;
            let totalPositives = this.usSnapshot.positive;
            let totalDeaths = this.usSnapshot.death;
            let percentTested = totalTests / this.usPopulation;
            let percentPositive = totalPositives / totalTests;
            let percentDead = totalDeaths / totalPositives;

            this.date = this.usSnapshot.lastModified.split('T')[0];
            this.totalTests = totalTests.toLocaleString();
            this.totalPositives = totalPositives.toLocaleString();
            this.totalDeaths = totalDeaths.toLocaleString();

            this.percentTested = percentTested.toLocaleString('en', {style: 'percent'}) + ' of population'
            this.percentPositive = percentPositive.toLocaleString('en', {style: 'percent'}) + ' of all tests';
            this.percentDead = percentDead.toLocaleString('en', {style: 'percent'}) + ' of all positives';

            this.loaded = true;
        },
    },
    mounted () {
        fetch(usCurrentApi)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                this.usSnapshot = data[0];
                app.renderSnapshot();
            });
        fetch(api)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                this.apiResult = data;
                // console.log(this.apiResult);
                app.render();
            })
        ;
    }
});
