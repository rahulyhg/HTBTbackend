myApp.filter('uploadpath', function () {
    return function (input, width, height, style) {
        var other = "";
        if (width && width !== "") {
            other += "&width=" + width;
        }
        if (height && height !== "") {
            other += "&height=" + height;
        }
        if (style && style !== "") {
            other += "&style=" + style;
        }
        if (input) {
            if (input.indexOf('https://') == -1) {
                return imgpath + "?file=" + input + other;
            } else {
                return input;
            }
        }
    };
});

myApp.filter('showdate', function () {
    return function (input) {
        return new Date(input);
    };
});
myApp.filter('urlencoder', function () {
    return function (input) {
        return window.encodeURIComponent(input);
    };
});

myApp.filter('propsFilter', function () {
    return function (items, props) {
        var out = [];

        if (angular.isArray(items)) {
            items.forEach(function (item) {
                var itemMatches = false;

                var keys = Object.keys(props);
                for (var i = 0; i < keys.length; i++) {
                    var prop = keys[i];
                    var text = props[prop].toLowerCase();
                    if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                        itemMatches = true;
                        break;
                    }
                }

                if (itemMatches) {
                    out.push(item);
                }
            });
        } else {
            // Let the output be the input untouched
            out = items;
        }

        return out;
    };
});

myApp.filter('serverimage', function () {
    return function (input, width, height, style) {
        if (input) {
            if (input.substr(0, 4) == "http") {
                return input;
            } else {
                image = imgpath + "?file=" + input;
                if (width) {
                    image += "&width=" + width;
                }
                if (height) {
                    image += "&height=" + height;
                }
                if (style) {
                    image += "&style=" + style;
                }
                return image;
            }

        } else {
            return "img/logo.png";
        }
    };
});

myApp.filter('convDate', function () {
    return function (input) {
        return new Date(input);
    };
});

myApp.filter('downloadImage', function () {
    return function (input) {
        if (input) {
            return adminurl + "download/" + input;
        } else {
            return "img/logo.png";
        }
    };
});

myApp.filter('ageFilter', function () {
    function calculateAge(birthday) { // birthday is a date
        var ageDifMs = Date.now() - birthday.getTime();
        var ageDate = new Date(ageDifMs); // miliseconds from epoch
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    return function (birthdate) {
        return calculateAge(birthdate);
    };
});
myApp.filter('momentDate', function () {
    return function (date, format) {
        if (!format) {
            format = "Do MMM YYYY, ddd";
        }
        return moment(date).format(format);
    };
});
myApp.filter('capitalize', function () {
    return function (input, all) {
        var reg = (all) ? /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/;
        return (!!input) ? input.replace(reg, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }) : '';
    };
});