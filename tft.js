const REROLL = [
    [29, 22, 18, 12, 10],
    [1.00, 0.00, 0.00, 0.00, 0.00],
    [1.00, 0.00, 0.00, 0.00, 0.00],
    [0.75, 0.25, 0.00, 0.00, 0.00],
    [0.55, 0.30, 0.15, 0.00, 0.00],
    [0.45, 0.33, 0.20, 0.02, 0.00],
    [0.25, 0.40, 0.30, 0.05, 0.00],
    [0.19, 0.30, 0.35, 0.15, 0.01],
    [0.16, 0.20, 0.35, 0.25, 0.04],
    [0.09, 0.15, 0.30, 0.30, 0.16]
];

const TIERCOUNT = [13, 13, 13, 12, 8];

function C(a, b) {
    if (b > a - b) {
        b = a - b;
    }
    let ans = 1;
    for (let i = 0; i < b; i++) {
        ans *= a - i;
        ans /= i + 1;
    }
    return ans;
}

function OneDraw(remain, total, tier_p, num) {
    if (remain < num) {
        return 0;
    }
    let ans = 0;
    for (let i = 0; i <= 5; i++) {
        if (i < num || total - remain < i - num) {
            continue;
        }
        let tmp = 1;
        tmp *= Math.pow(tier_p, i) * Math.pow(1 - tier_p, 5 - i) * C(5, i);
        tmp *= C(remain, num) * C(total - remain, i - num) / C(total, i);
        ans += tmp;
    }
    return ans;
}

function ExpDraw(remain, total, tier_p, required) {
    let cur = new Array(required + 1).fill(0);
    let nx = new Array(required + 1).fill(0);
    let cdf = [];
    let pmf = [0];
    let expValue = 0;

    cur[0] = 1;
    let j = 1;
    while (j % 20 !== 0 || cdf[cdf.length - 1] < 0.999) {
        for (let i = 0; i <= required; i++) {
            for (let k = 0; k <= 5; k++) {
                const nxState = i + k <= required ? i + k : required;
                nx[nxState] += cur[i] * OneDraw(remain - i, total - i, tier_p, k);
            }
        }
        cdf.push(nx[required]);
        pmf.push(nx[required] - cur[required]);
        cur = nx;
        nx = new Array(required + 1).fill(0);
        expValue += j * pmf[pmf.length - 1];
        j += 1;
    }

    return [cdf, pmf, expValue, j];
}

let chart = null;

function ShowPlot(level, tier, required, exisited, totalexisted) {
  const remain = REROLL[0][tier - 1] - exisited;
  const total = REROLL[0][tier - 1] * TIERCOUNT[tier - 1] - totalexisted;
  const tier_p = REROLL[level][tier - 1];

  const [d, l, expValue, maxdraw] = ExpDraw(remain, total, tier_p, required);
  console.log(expValue);

  const canvas = document.getElementById('myChart');

  if (chart) {
    chart.destroy();
  }

  const ctx = canvas.getContext('2d');
  chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from(Array(l.length).keys()),
            datasets: [
                {
                    label: 'PMF',
                    data: l,
                    backgroundColor: 'rgba(0, 123, 255, 0.8)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'CDF',
                    data: d,
                    type: 'line',
                    fill: false,
                    borderColor: 'rgba(255, 0, 0, 1)',
                    tension: 0,
                    yAxisID: 'y1'
                }
                // {
                //     label: 'Expect',
                //     data: [{ x: expValue, y: 0 }, { x: expValue, y: Math.max(...l) }],
                //     type: 'line',
                //     fill: false,
                //     borderColor: 'rgba(0, 0, 0, 1)',
                //     borderWidth: 1
                // }
            ]
        },
        options: {
            elements: {
                point:{
                    radius: 1
                }
            },
            scales: {
                x: {
                    ticks: {
                        stepSize: maxdraw / 20
                    }
                },
                y: {
                    beginAtZero: true,
                    max: Math.max(...l),
                    ticks: {
                        stepSize: (Math.max(...l)) / 10
                    },
                    position: 'left'
                },
                y1: {
                    beginAtZero: true,
                    max: Math.max(...d),
                    ticks: {
                        stepSize: (Math.max(...d)) / 10
                    },
                    position: 'right'
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed.y;
                            if (context.dataset.label === 'Expect') {
                                return `Expect: ${expValue.toFixed(3)}`;
                            } else if (context.dataset.label === 'PMF'){
                                return `PMF: ${value.toFixed(4)}`;
                            } else if (context.dataset.label === 'CDF'){
                                return `CDF: ${value.toFixed(3)}`;
                            }
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 10
                }
            }
        }
    });


    // Update the chart
    chart.update();
}

const levelSlider = document.getElementById('level-slider');
const tierSlider = document.getElementById('tier-slider');
const requiredSlider = document.getElementById('required-slider');
const exisitedSlider = document.getElementById('exisited-slider');
const totalexistedSlider = document.getElementById('totalexisted-slider');

const levelValue = document.getElementById('level-value');
const tierValue = document.getElementById('tier-value');
const requiredValue = document.getElementById('required-value');
const exisitedValue = document.getElementById('exisited-value');
const totalexistedValue = document.getElementById('totalexisted-value');

levelSlider.addEventListener('input', function () {
  levelValue.textContent = levelSlider.value;
  updateChart();
});

tierSlider.addEventListener('input', function () {
  tierValue.textContent = tierSlider.value;
  updateChart();
});

requiredSlider.addEventListener('input', function () {
  requiredValue.textContent = requiredSlider.value;
  updateChart();
});

exisitedSlider.addEventListener('input', function () {
  exisitedValue.textContent = exisitedSlider.value;
  updateChart();
});

totalexistedSlider.addEventListener('input', function () {
  totalexistedValue.textContent = totalexistedSlider.value;
  updateChart();
});

function updateChart() {
  var level = parseInt(levelSlider.value);
  var tier = parseInt(tierSlider.value);
  var required = parseInt(requiredSlider.value);
  var exisited = parseInt(exisitedSlider.value);
  var totalexisted = parseInt(totalexistedSlider.value);

    if (level >= 7) {
      tierSlider.setAttribute('max', '5');
    } else if (level >= 5) {
      tierSlider.setAttribute('max', '4');
    } else if (level >= 4) {
      tierSlider.setAttribute('max', '3');
    } else if (level >= 3) {
        tierSlider.setAttribute('max', '2');
  }else if (level >= 1) {
        tierSlider.setAttribute('max', '1');
    } 
    
    var d = REROLL[0][tier - 1] - exisited
    if(d > 9){
        d = 9;
    }
    requiredSlider.setAttribute('max', d.toString());
    exisitedSlider.setAttribute('max', (REROLL[0][tier - 1] - required).toString());
    if(exisited + required > REROLL[0][tier - 1]){
        exisitedSlider.value = REROLL[0][tier - 1] - required;
        exisited = REROLL[0][tier - 1] - required;
        console.log(exisitedSlider.value);
        exisitedValue.textContent = exisitedSlider.value;
        // exisitedValue.textContent = 0;
        // requiredSlider.value = 0;
        // exisited = required = 0;
    }
  
  ShowPlot(level, tier, required, exisited, totalexisted);
}
ShowPlot(1, 1, 1, 0, 0);
// ShowPlot(4, 1, 1, 1, 7);
// ShowPlot(9, 5, 6, 3, 12);

