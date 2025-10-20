function iterateRecords(data) {
    console.log("Data returned: " + JSON.stringify(data));

    var records = data.results;

    Object.values(records).forEach(value => {
        var subject = value["subject"];
        var location = value["location"];
        var date = value["formatteddatetime"];
        var age = value["age"];
        var image = value["eventimage"];

        // Filter out events for young adults, adults, seniors
        if (!age || /young adult|adult|senior/i.test(age)) {
            return;
        }

        // Cost and points calculation
        var rawCost = value["cost"];
        var points = 0;
        var priceLabel = "N/A";

        if (rawCost) {
            let price = rawCost.toLowerCase() === "free" ? 0 : parseInt(rawCost.replace(/[^0-9]/g, ''), 10) || 0;

            if (price === 0) points = 1;
            else if (price <= 10) points = 2;
            else if (price > 10) points = 3;

            if (price === 0) priceLabel = "$";
            else if (price <= 10) priceLabel = "$$";
            else if (price > 10) priceLabel = "$$$";
        }

        var price = priceLabel;

        // Create the record only if required fields exist
        if (subject && location && date && age && price && points) {
            const recordSection = $('<section class="record">');

            recordSection.append(
                image ? $('<img>').attr('src', image).attr('alt', subject) : null,

                $('<div class="record-content">').append(
                    $('<div class="record-header">').append(
                        $('<h2>').text(subject),
                        $('<span class="price-label">').text(price)
                    ),
                    $('<div class="record-tags">').append(
                        $('<span class="tag" id="points">').html(`
                            Points: ${points}
                            <span class="tooltip">
                                <a href="/html/resources_guide.html">Go to tutorial</a>
                            </span>
                        `),
                        $('<span class="tag">').text(location),
                        $('<span class="tag">').text(age),
                        $('<span class="tag">').text(date)
                    )
                )
            );


            // Make the whole record clickable
            recordSection.click(function () {
                const params = new URLSearchParams({
                    subject: subject,
                    start: value["start_datetime"],
                    end: value["end_datetime"]
                });
                window.location.href = "/html/event_details.html?" + params.toString();
            });

            $("#records").append(recordSection);
        }
    });
}

$(document).ready(function () {
    const apiURLs = [
        "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/infants-and-toddlers-events/records",
        "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/library-events/records"
    ];

    const requestParams = { limit: 50 };
    const queryString = new URLSearchParams(requestParams).toString();

    apiURLs.forEach(apiURL => {
        const fullURL = apiURL + "?" + queryString;
        console.log("Fetching: " + fullURL);

        fetch(fullURL)
            .then(response => response.json())
            .then(data => iterateRecords(data))
            .catch(error => console.error("Error fetching data from " + apiURL, error));
    });
});


$(document).ready(function () {
    const apiURLs = [
        "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/infants-and-toddlers-events/records",
        "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/library-events/records"
    ];

    const requestParams = { limit: 50 };
    const queryString = new URLSearchParams(requestParams).toString();

    apiURLs.forEach(apiURL => {
        const fullURL = apiURL + "?" + queryString;
        console.log("Fetching: " + fullURL);

        fetch(fullURL)
            .then(response => response.json())
            .then(data => iterateRecords(data))
            .catch(error => console.error("Error fetching data from " + apiURL, error));
    });
});
