$(document).ready(function () {
    $("#vehicle-form").submit(function (e) {
        e.preventDefault();
        const vehicle = $('#vehicle').val();
        $("#result").html('');
        $("#progress-msg").html("<span>fetching data for " + vehicle + "...</span>");
        var timer;
        $.ajax({
            url: '/api/getInventoryList',
            method: 'post',
            data: {
                vehicle
            }
        }).done(function (data) {
            $("#result").html(data.data.data);
            clearTimeout(timer);
        });

        let loop = 0;
        timer = setInterval(function () {
            loop = loop + 1;
            $.ajax({
                url: '/api/getProgress',
                method: 'post',
            }).done(function (data) {
                const {
                    status = '', errorEmitter = [], progressPercent
                } = data;
                let domToInject = "<span>";
                if (progressPercent) {
                    domToInject = domToInject + "<p>" + parseInt(progressPercent) + "% processing completed </p><br/>";
                }
                if (errorEmitter.length) {
                    domToInject = domToInject + "<p>" + errorEmitter.join(",") + " data error occured </p><br/>";
                }
                $("#progress-msg").html(domToInject);
            });
            if (loop > 200) {
                clearTimeout(timer);
            }
        }, 500);
    });
});
