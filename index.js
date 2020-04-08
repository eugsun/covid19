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
        apiResult: null,
    },
    methods: {
        render: function () {
            this.movingAvgDays = Number(this.movingAvgDays);
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
                        borderColor: stateColor,
                        backgroundColor: stateColor,
                        hidden: d.state != "NY" && d.state != "MD",
                        fill: false,
                    })
                }
                datasetMap.get(d.state).data.push(d.positiveIncrease);
                // datasetMap.get(d.state).data.push(d.deathIncrease);
            });
            let labels = Array.from(labelSet);
            labels.sort();

            let datasets = Array.from(datasetMap.values());
            datasets.forEach(function(dataset) {
                dataset.data.reverse();

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
                    console.log(`for ${i}: ${sumOriginal} => ${sumOriginalNow} Grew by ${val}`);
                    avgGrowthFactors.push(val);
                }
                dataset.data = avgGrowthFactors;
            });
            this.chartData = {
                labels: labels,
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
                            max: 3,
                            stepSize: 0.5,
                        }
                    }],
                },
            };
            this.loaded = true;
        }
    },
    mounted () {
        fetch(api)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                this.apiResult = data;
                console.log(this.apiResult);
                app.render();
            })
        ;
    }
});
