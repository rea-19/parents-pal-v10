$(".filter-box").click(function(e){
    e.stopPropagation();
    $(".filter-box").not(this).removeClass("active");
    $(this).toggleClass("active");

    const dropdown = $(this).find(".checkbox-dropdown");
    if(dropdown.length){
        const offset = $(this).offset();
        dropdown.css({
            top: offset.top + $(this).outerHeight() + 4 + "px", // slightly below
            left: offset.left + "px",
            width: $(this).outerWidth() + "px"
        });
    }
});

$(document).click(function(){
    $(".filter-box").removeClass("active");
});



$("body").click(function(){
    $(".filter-box").removeClass("active");
});

function renderSelectedFilters() {
    const container = $("#selected-filters");
    container.empty();

    $("#age option:selected").each(function() {
        const val = $(this).val();
        const tag = $('<div class="filter-tag"><span>Age: ' + val + '</span><button>&times;</button></div>');
        tag.find("button").click(function() {
            $(this).parent().remove();
            $(this).parent().remove(); 
            $("#age option[value='" + val + "']").prop("selected", false);
            filterEvents();
        });
        container.append(tag);
    });

    const costSlider = $("#cost-slider").data("ionRangeSlider");
    if(costSlider){
        const val = `$${costSlider.result.from} - $${costSlider.result.to}`;
        const tag = $('<div class="filter-tag"><span>Cost: ' + val + '</span><button>&times;</button></div>');
        tag.find("button").click(function() {
            costSlider.update({from: costSlider.options.min, to: costSlider.options.max});
            filterEvents();
            renderSelectedFilters();
        });
        container.append(tag);
    }

    $(".checkbox-dropdown input[type='checkbox']:checked").each(function() {
        const val = $(this).val();
        const tag = $('<div class="filter-tag"><span>Activity: ' + val + '</span><button>&times;</button></div>');
        tag.find("button").click(function() {
            $(this).parent().remove();
            $(".checkbox-dropdown input[type='checkbox'][value='" + val + "']").prop("checked", false);
            filterEvents();
            renderSelectedFilters();
        });
        container.append(tag);
    });

    const suburbVal = $("#suburb").val();
    if(suburbVal) {
        const tag = $('<div class="filter-tag"><span>Suburb: ' + suburbVal + '</span><button>&times;</button></div>');
        tag.find("button").click(function() {
            $("#suburb").val('');
            filterEvents();
            renderSelectedFilters();
        });
        container.append(tag);
    }

    const dateVal = $("#date-range").val();
    if(dateVal) {
        const tag = $('<div class="filter-tag"><span>Date: ' + dateVal + '</span><button>&times;</button></div>');
        tag.find("button").click(function() {
            $("#date-range").val('');
            filterEvents();
            renderSelectedFilters();
        });
        container.append(tag);
    }
}


$(document).ready(function(){
    $("#age, #suburb, #cost-slider").on("change input", function(){
        filterEvents();
        renderSelectedFilters();
    });
    $(".checkbox-dropdown input[type='checkbox']").on("change", function(){
        filterEvents();
        renderSelectedFilters();
    });
    flatpickr("#date-range", {
        mode:"range",
        dateFormat:"Y-m-d",
        onClose: function() {
            filterEvents();
            renderSelectedFilters();
        }
    });
});


let allFetchedRecords = [];

const originalIterateRecords = window.iterateRecords;
window.iterateRecords = function(data) {
    allFetchedRecords = allFetchedRecords.concat(data.results);
    originalIterateRecords(data);
};


function parseAgeRange(str) {
    str = str.toLowerCase();

    // Convert "6 months" to fraction of year
    const monthMatch = str.match(/(\d+)\s*months?/);
    const yearMatches = str.match(/(\d+)\s*years?/g);
    const dashMatch = str.match(/(\d+)[–\-](\d+)/);

    let min = 0, max = 100;

    // Check for dash style "x-y"
    if(dashMatch) {
        min = parseInt(dashMatch[1], 10);
        max = parseInt(dashMatch[2], 10);
    }
    // Check for "x months to y years" style
    else if(monthMatch && yearMatches && yearMatches.length > 0){
        min = parseInt(monthMatch[1],10)/12;
        max = parseInt(yearMatches[0],10);
    }
    // Check for single "x-y years" style
    else if(yearMatches && yearMatches.length === 2){
        min = parseInt(yearMatches[0],10);
        max = parseInt(yearMatches[1],10);
    }
    // Fallback for single number
    else if(yearMatches && yearMatches.length === 1){
        min = 0;
        max = parseInt(yearMatches[0],10);
    }

    return [min, max];
}

function rangesOverlap(min1, max1, min2, max2){
    return Math.max(min1, min2) <= Math.min(max1, max2);
}


function filterEvents() {
    if(allFetchedRecords.length === 0) return; // nothing to filter yet

    const selectedAges = $("#age").val() || [];
    const costSlider = $("#cost-slider").data("ionRangeSlider");
    const costMin = costSlider ? costSlider.result.from : 0;
    const costMax = costSlider ? costSlider.result.to : 200;
    const selectedActivities = $(".checkbox-dropdown input[type='checkbox']:checked").map(function(){
        return $(this).val();
    }).get();
    const suburbInput = $("#suburb").val().toLowerCase();
    const dateRange = $("#date-range").val().split(" to ");
    let startDate = dateRange[0] ? new Date(dateRange[0]) : null;
    let endDate = dateRange[1] ? new Date(dateRange[1]) : null;

    // If only one date selected, set endDate to same day 11:59pm
    if(startDate && !endDate){
        endDate = new Date(startDate);
        endDate.setHours(23,59,59,999);
    }

    const filtered = allFetchedRecords.filter(event => {
        if(selectedAges.length && event.age){
            const [eventMin, eventMax] = parseAgeRange(event.age);
            const matches = selectedAges.some(sel => {
                const parts = sel.split("-");
                const selMin = parseInt(parts[0],10);
                const selMax = parseInt(parts[1],10);
                return rangesOverlap(eventMin, eventMax, selMin, selMax);
            });
            if(!matches) return false;
        }

        if(event.cost) {
            const costValue = parseFloat(event.cost.replace(/[^0-9.]/g,'')) || 0;
            if(costValue < costMin || costValue > costMax) return false;
        }       

        if(selectedActivities.length && event.event_type) {
            if(!selectedActivities.some(act => event.event_type.includes(act))) return false;
        }

        if(selectedActivities.length && event.event_type) {
            if(!selectedActivities.some(act => event.event_type.includes(act))) return false;
        }
        if(suburbInput && event.venueaddress) {
        // Split venueaddress by commas, trim spaces, lowercase
            const parts = event.venueaddress.split(",").map(p => p.trim().toLowerCase());
            const eventSuburb = parts[parts.length - 1]; // last part is usually the suburb
            if(!eventSuburb.includes(suburbInput.toLowerCase())) return false;
        }

        if(startDate && endDate && event.start_datetime) {
            const evDate = new Date(event.start_datetime);
            if(evDate < startDate || evDate > endDate) return false;
        }

        return true;
    });

    $("#records").empty();
    if(filtered.length === 0) {
        $("#records").html('<div style="text-align:center;font-size:1em;color:#888;">No events available for the set filters</div>');
    } else {
        originalIterateRecords({results: filtered});
    }
}


$(document).ready(function(){
    $("#age, #suburb, #cost-slider").on("change input", filterEvents);
    $(".checkbox-dropdown input[type='checkbox']").on("change", filterEvents);
    flatpickr("#date-range", {
        mode:"range",
        dateFormat:"Y-m-d",
        onClose: filterEvents
    });
});


// SAVE PREFERENCES 
function getCurrentPreferences() {
    const age = $("#age").val() || [];
    const costSlider = $("#cost-slider").data("ionRangeSlider");
    const cost = costSlider ? {from: costSlider.result.from, to: costSlider.result.to} : {from: 0, to: 200};
    const activities = $(".checkbox-dropdown input[type='checkbox']:checked").map(function(){ return $(this).val(); }).get();
    const suburb = $("#suburb").val() || "";
    const dateRange = $("#date-range").val() || "";

    return {
        age,
        cost,
        activities,
        suburb,
        dateRange
    };
}

function savePreferences() {
    const loggedIn = localStorage.getItem("loggedIn") === "true";

    if (!loggedIn) {
        // user NOT signed in, show login popup instead of saving
        const popup = document.getElementById('popupContainer');
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');

        if (popup && loginForm && signupForm) {
            popup.style.display = 'flex';
            loginForm.style.display = 'flex';
            signupForm.style.display = 'none';
        } else {
            alert("Please sign in to save preferences.");
        }
        return;
    }

    // user is signed in continue as normal
    const prefs = getCurrentPreferences();
    localStorage.setItem("savedPreferences", JSON.stringify(prefs));
    alert("Preferences saved!");
    $("#preference-toggle").show();
}


function applySavedPreferences() {
    const prefsStr = localStorage.getItem("savedPreferences");
    if (!prefsStr) return;
    const prefs = JSON.parse(prefsStr);

    // Age
    $("#age").val(prefs.age);

    // Cost
    const costSlider = $("#cost-slider").data("ionRangeSlider");
    if (costSlider && prefs.cost) {
        costSlider.update({from: prefs.cost.from, to: prefs.cost.to});
    }

    // Activities
    $(".checkbox-dropdown input[type='checkbox']").prop("checked", false);
    if (prefs.activities && prefs.activities.length) {
        prefs.activities.forEach(val => {
            $(".checkbox-dropdown input[type='checkbox'][value='" + val + "']").prop("checked", true);
        });
    }

    // Suburb
    $("#suburb").val(prefs.suburb);

    // Date Range
    $("#date-range").val(prefs.dateRange);

    filterEvents();
    renderSelectedFilters();
}

function clearAllFilters() {
    $("#age").val([]);
    const costSlider = $("#cost-slider").data("ionRangeSlider");
    if (costSlider) {
        costSlider.update({from: costSlider.options.min, to: costSlider.options.max});
    }
    $(".checkbox-dropdown input[type='checkbox']").prop("checked", false);
    $("#suburb").val('');
    $("#date-range").val('');
    filterEvents();
    renderSelectedFilters();
}

$(document).ready(function(){
    $("#age, #suburb, #cost-slider").on("change input", function(){
        filterEvents();
        renderSelectedFilters();
    });
    $(".checkbox-dropdown input[type='checkbox']").on("change", function(){
        filterEvents();
        renderSelectedFilters();
    });
    flatpickr("#date-range", {
        mode:"range",
        dateFormat:"Y-m-d",
        onClose: function() {
            filterEvents();
            renderSelectedFilters();
        }
    });
    $("#save-filters-button").on("click", savePreferences);

    // Show preference toggle if preferences exist
    if (localStorage.getItem("savedPreferences")) {
        $("#preference-toggle").show();
    }

    $("#apply-preferences-checkbox").on("change", function() {
        if (this.checked) {
            applySavedPreferences();
        } else {
            clearAllFilters();
        }
    });
});

