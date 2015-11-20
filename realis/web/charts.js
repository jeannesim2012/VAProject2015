var unitPriceHistChart = dc.barChart("#chart-hist-unitPrice"),
        priceLineChart = dc.lineChart("#chart-line"),
        volumeChart = dc.barChart('#monthly-volume-chart'),
        propertyRowChart = dc.rowChart("#chart-row-propertyType"),
        nasdaqTable = dc.dataTable(".dc-data-table");

var parseDate = d3.time.format("%d-%b-%y").parse;
var parseDateTable = d3.time.format("%d-%b-%y");
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

    nasdaqTable /* dc.dataTable('.dc-data-table', 'chartGroup') */
            .dimension(date)
            .group(function (d) {
                return "";
            })
            // (_optional_) max number of records to be shown, `default = 25`
            .size(10)
            // There are several ways to specify the columns; see the data-table documentation.
            // This code demonstrates generating the column header automatically based on the columns.
            .columns([
                function (d) {
                    return  d.projectName;
                }, function (d) {
                    return  d.address;
                }, function (d) {
                    return  d.area;
                }, function (d) {
                    return d.typeOfArea;
                }, function (d) {
                    return  "$" + d.transactedPrice;
                }, function (d) {
                    return  "$" + d.unitPricePSM;
                }, function (d) {
                    return  "$" + d.unitPricePSF;
                }, function (d) {
                    return d.saleDate;
                }, function (d) {
                    return d.propertyType;
                }, function (d) {
                    return d.tenure;
                }, function (d) {
                    return d.postalDistrict;
                }, function (d) {
                    return d.postalCode;
                }, function (d) {
                    return d.planningRegion;
                }, function (d) {
                    return d.planningArea;
                }
            ])
            // (_optional_) sort using the given field, `default = function(d){return d;}`
            .sortBy(function (d) {
                return d.dd;
            })
            // (_optional_) sort order, `default = d3.ascending`
            .order(d3.ascending)
            // (_optional_) custom renderlet to post-process chart using [D3](http://d3js.org)
            .on('renderlet', function (table) {
                table.selectAll('.dc-table-group').classed('info', true);
            });
    dc.renderAll();
});