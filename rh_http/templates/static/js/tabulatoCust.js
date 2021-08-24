//$(document).ready(function() {
//    var url = 'https://cp.simpple.ru/api/v1/widgets/ratings/753bf174295992b3ca2d0bd4a78d6598/popular&limit=8';
//    $.get(url, function(response) {
//        var table = new Tabulator('#example-table', {
//    data: JSON.parse(response),
//    layout: 'fitColumns',
//            movableColumns:false,
//	resizableRows:false,
//            initialSort:[             //set the initial sort order of the data
//		{column:"ФИО", dir:"asc"},
//	],
//    columns: [
//        { title: 'ФИО', field: 'title'},
//        { title: 'Количество тестов', field: 'countRates', align: 'left' },
//        { title: 'Средний балл', field: 'rating' },
//        { title: 'Детали', field: 'rating', formatter: "link"
//        }]
//});
//    });
//});