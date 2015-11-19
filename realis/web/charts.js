var unitPriceHistChart = dc.barChart("#chart-hist-unitPrice"),
        priceLineChart = dc.lineChart("#chart-line"),
        volumeChart = dc.barChart('#monthly-volume-chart'),
        propertyRowChart = dc.rowChart("#chart-row-propertyType");

var parseDate = d3.time.format("%d-%b-%y").parse;
var dtgFormat2 = d3.time.format("%a %e %b");

// d3.csv('./data/sample.csv', function(transactions) {
d3.csv('data/REALIS2014.csv', function (transactions) {
    //Basic Transform
    transactions.forEach(function (d, i) {
        d.index = i;
        d.date = parseDate(d.saleDate);
        d.area = parseInt(d.area, 10);
        d.unitSold = parseInt(d.unitSold, 10);
        d.transactedPrice = parseInt(d.transactedPrice, 10);
        d.unitPricePSM = parseInt(d.unitPricePSM, 10);
    });

    transaction = crossfilter(transactions);

    // all = transaction.groupAll();
    date = transaction.dimension(function (d) {
        return d3.time.day(d.date);
    });

    unitPricePSMDim = transaction.dimension(function (d) {
        return (d.unitPricePSM);
    });

    unitPriceHist = unitPricePSMDim.group().reduceCount(function (d) {
        return d.unitPricePSM;
    });

    propertyType = transaction.dimension(function (d) {
        return d.propertyType;
    });

    unitSoldPerPropertyType = propertyType.group().reduceSum(function (d) {
        return +d.unitSold;
    });

    logTransactionPriceByMonthGroup = date.group().reduceSum(function (d) {
        return +Math.log(d.transactedPrice);
    });

    apartmentValues = date.group().reduceSum(function (d) {
        if (d.transactedPrice > 0) {
            return +d.transactedPrice;
        } else {
            return 0;
        }
    });

    propertyRowChart
            .width(500).height(200)
            .dimension(propertyType)
            .group(unitSoldPerPropertyType)
            .elasticX(true);

    unitPriceHistChart
            .width(400)
            .height(200)
            .dimension(unitPricePSMDim)
            .group(unitPriceHist)
            .gap(1)
            .x(d3.scale.linear().domain([1500, 40000]))
            .elasticY(true);

    priceLineChart
            .renderArea(true)
            .width(990)
            .height(200)
            .transitionDuration(1000)
            .margins({top: 30, right: 50, bottom: 25, left: 75})
            .dimension(date)
            .mouseZoomable(true)
            .rangeChart(volumeChart)
            .x(d3.time.scale().domain([new Date(2014, 0, 1), new Date(2014, 12, 31)]))
            .round(d3.time.day.round)
            .xUnits(d3.time.days)
            .elasticY(true)
            .renderHorizontalGridLines(true)
            .brushOn(false)
            .group(apartmentValues)
            .valueAccessor(function (d) {
                console.log(d.value);
                return d.value;
            })
            .title(function (d) {
                return dtgFormat2(d.key)
                        + "\nTransaction Price: $" + d.value;
            })
            .yAxisLabel("Transacted Price");

    volumeChart.width(990)
            .height(40)
            .margins({top: 0, right: 50, bottom: 20, left: 85})
            .dimension(date)
            .group(logTransactionPriceByMonthGroup)
            .centerBar(true)
            .gap(0.5)
            .x(d3.time.scale().domain([new Date(2014, 0, 1), new Date(2014, 12, 31)]))
            .round(d3.time.day.round)
            .alwaysUseRounding(true)
            .xUnits(d3.time.days);

    unitPriceHistChart.xAxis().tickFormat(function (d) {
        return d
    }); // convert back to base unit
    unitPriceHistChart.yAxis().ticks(2);

    dc.renderAll();
});