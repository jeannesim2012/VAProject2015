var unitPriceHistChart = dc.barChart("#chart-hist-unitPrice"),
        priceLineChart = dc.lineChart("#chart-line"),
        volumeChart = dc.barChart('#monthly-volume-chart'),
        propertyRowChart = dc.rowChart("#chart-row-propertyType"),
        nasdaqTable = dc.dataTable(".dc-data-table"),
        nasdaqCount = dc.dataCount('.dc-data-count'),
        sunburstChart = dc.sunburstChart("#sunburst");

var parseDate = d3.time.format("%d-%b-%y").parse;
var dtgFormat2 = d3.time.format("%a %e %b");

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
    all = transaction.groupAll();

    date = transaction.dimension(function (d) {
        return d3.time.day(d.date);
    });

    //for sunburst
    runDimension  = transaction.dimension(function(d) {return [d.planningRegion, d.planningArea, d.postalDistrict];});
    speedSumGroup = runDimension.group().reduceSum(function(d) {return d.unitPricePSM;});

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
        return +Math.log(d.unitPricePSM);
    });

    apartmentValues = date.group().reduceSum(function (d) {
        if (d.unitPricePSM > 0) {
            return +d.unitPricePSM;
        } else {
            return 0;
        }
    });
    
    sunburstChart
        .width(470)
        .height(400)
        .innerRadius(50)
        .dimension(runDimension)
        .group(speedSumGroup)
        //.ordinalColors(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628'])
        .legend(dc.legend());
    
    propertyRowChart
            .width(650).height(300)
            .dimension(propertyType)
            .group(unitSoldPerPropertyType)
            .elasticX(true);

    unitPriceHistChart
            .width(1170)
            .height(200)
            .dimension(unitPricePSMDim)
            .group(unitPriceHist)
            .rangeChart(volumeChart)
            .elasticY(true)
            .renderHorizontalGridLines(true)
            .gap(1)
            .x(d3.scale.linear().domain([1371,49791]))
            .elasticY(true)
            .yAxisLabel("Number of Units")
            .xAxisLabel("Unit Price (PSM)");

    priceLineChart
            .renderArea(true)
            .width(1170)
            .height(200)
            .transitionDuration(1000)
            .margins({top: 30, right: 50, bottom: 25, left: 75})
            .dimension(date)
            .mouseZoomable(true)
            .rangeChart(volumeChart)
            .x(d3.time.scale().domain([new Date(2014, 0, 1), new Date(2014, 11, 30)]))
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
                        + "\nUnit Price (PSM): $" + d.value;
            })
            .yAxisLabel("Unit Price (PSM)");

    volumeChart.width(990)
            .height(40)
            .margins({top: 0, right: 50, bottom: 20, left: 85})
            .dimension(date)
            .group(logTransactionPriceByMonthGroup)
            .centerBar(true)
            .gap(0.5)
            .x(d3.time.scale().domain([new Date(2014, 0, 1), new Date(2014, 11, 30)]))
            .round(d3.time.day.round)
            .alwaysUseRounding(true)
            .xUnits(d3.time.days);

    unitPriceHistChart.xAxis().tickFormat(function (d) {
        return d
    }); // convert back to base unit
    unitPriceHistChart.yAxis().ticks(2);

    nasdaqCount /* dc.dataCount('.dc-data-count', 'chartGroup'); */
            .dimension(transaction)
            .group(all)
            // (_optional_) `.html` sets different html when some records or all records are selected.
            // `.html` replaces everything in the anchor with the html given using the following function.
            // `%filter-count` and `%total-count` are replaced with the values obtained.
            .html({
                some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
                        ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>Reset All</a>',
                all: 'All records selected. Please click on the graph to apply filters.'
            });


    nasdaqTable /* dc.dataTable('.dc-data-table', 'chartGroup') */
            .dimension(date)
            .group(function (d) {
                return "";
            })
            .size(transaction.size())
            .columns([
                function (d) {
                    return  d.projectName;
                }, function (d) {
                    return  d.address;
                }, function (d) {
                    return  "$" + d.unitPricePSM;
                }, function (d) {
                    return d.saleDate;
                }, function (d) {
                    return d.propertyType;
                }, function (d) {
                    return d.tenure;
                }, function (d) {
                    return d.postalDistrict;
                }, function (d) {
                    return d.planningRegion;
                }, function (d) {
                    return d.planningArea;
                }
            ])
            .sortBy(function (d) {
                return d.dd;
            })
            .order(d3.ascending)
            .on('renderlet', function (table) {
                table.selectAll('.dc-table-group').classed('info', true);
            });
    dc.renderAll();
});