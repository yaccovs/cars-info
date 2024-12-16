async function fetchCSVToObject(url) {
    try {
        // הורדת תוכן ה-CSV
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }

        // קריאת הטקסט של הקובץ
        const csvText = await response.text();

        // המרת ה-CSV לשורות
        const rows = csvText.split("\n").map(row => row.trim()).filter(row => row);

        // הפרדת כותרות
        const headers = rows.shift().split(",").map(header => header.trim());

        // המרת שורות לאובייקטים
        const result = rows.map(row => {
            const values = row.split(",").map(value => value.trim());
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || null; // התמודדות עם ערכים חסרים
            });
            return obj;
        });

        return result;
    } catch (error) {
        console.error("Error fetching or parsing CSV:", error);
        throw error;
    }
}

async function renderMarkdown() {
	try {
	// טען את קובץ ה-MD
	const response = await fetch(markdownFile);
	if (!response.ok) {
	  throw new Error('Failed to fetch the Markdown file');
	}
	
	// קרא את תוכן הקובץ כטקסט
	const markdown = await response.text();
	
	// המרת Markdown ל-HTML באמצעות marked.js
	const html = marked.marked(markdown);
	
	// הצגת ה-HTML בתוך העמוד
	document.querySelector('.header').innerHTML = html;
	} catch (error) {
	console.error('Error:', error);
	}
}

let dataFromJSON, sortInfoJSON, dataFromCSV;
const markdownFile = './README.md';
renderMarkdown();

(async () => {
    const url = "./data_cars.csv";
    try {
        const data = await fetchCSVToObject(url);
	dataFromJSON = data;
        console.log(data);
	    start();
    } catch (error) {
        console.error("Failed to process CSV:", error);
    }
})();

fetch("./data.json")
  .then((response) => response.json())
  .then((data) => {
    dataFromJSON2 = data;
    // start();
  });
fetch("./sort.json")
  .then((response) => response.json())
  .then((data) => {
    sortInfoJSON = data;
  });

let optionsFields = [
  {
    field: "select-manufactor",
    fieldUrlServer: "mfr",
    fieldKeyJSON: "יצרן הרכב",
    value: undefined,
    options: [],
  },
  {
    field: "select-model",
    fieldUrlServer: "model",
    fieldKeyJSON: "דגם הרכב",
    value: undefined,
    options: [],
  },
  {
    field: "select-year",
    fieldUrlServer: "year",
    fieldKeyJSON: "שנה",
    value: undefined,
    options: [],
  },
];

const filterBySelects = (obj) => {
  if (typeof optionsFields[0].value === "undefined") return true;
  if (obj[optionsFields[0].fieldKeyJSON] === optionsFields[0].value) {
    if (typeof optionsFields[1].value === "undefined") return true;
    if (obj[optionsFields[1].fieldKeyJSON] === optionsFields[1].value) {
      if (typeof optionsFields[2].value === "undefined") return true;
      return (
        String(obj[optionsFields[2].fieldKeyJSON]) ===
        String(optionsFields[2].value)
      );
    }
  }
};

async function start() {
  const uniqs = new Set();
  dataFromJSON.forEach((obj) => uniqs.add(obj[optionsFields[0].fieldKeyJSON]));
  optionsFields[0].options = [...uniqs].sort();

  fillSelect(0);
}

function fillSelect(fieldNum) {
  const options = optionsFields[fieldNum].options;
  const field = optionsFields[fieldNum].field;
  let container = document.querySelector(`.${field}`);
  container.classList.add("not-select");
  container.innerHTML = `<option value="" disabled selected>== ${optionsFields[fieldNum].fieldKeyJSON} ==</option>`;
  options.forEach((option) => {
    let tag_option = document.createElement("option");
    tag_option.value = option;
    tag_option.textContent = option;
    container.appendChild(tag_option);
  });
}

async function setSelectOptions(fieldNum) {
  clearContainerDetails();
  for (let i = fieldNum; i < optionsFields.length; i++) {
    const optionsField = optionsFields[i];
    optionsField.value = undefined;
    const fieldToDef = document.querySelector(`.${optionsFields[i].field}`);
    fieldToDef.innerHTML = `<option value="" disabled selected>== ${optionsFields[i].fieldKeyJSON} ==</option>`;
    fieldToDef.classList.add("not-select");
  }

  const uniqs = new Set();
  const carFilter = dataFromJSON.filter(filterBySelects);
  carFilter.forEach((obj) =>
    uniqs.add(obj[optionsFields[fieldNum].fieldKeyJSON])
  );
  optionsFields[fieldNum].options = [...uniqs].sort();

  fillSelect(fieldNum);
  if (optionsFields[fieldNum].options.length === 1) {
    const value = optionsFields[fieldNum].options[0];
    optionsFields[fieldNum].value = value;
    document.querySelector(`.${optionsFields[fieldNum].field}`).value = value;
    document.querySelector(`.${optionsFields[fieldNum].field}`).onchange();
  }
}

async function fillDetails() {
  let container = clearContainerDetails();

  const info = dataFromJSON.find(filterBySelects);

  infoKeys = Object.keys(info);
  try {
    infoKeys.sort((a, b) => sortInfoJSON[b] - sortInfoJSON[a]);
  } catch (error) {
    console.log("Not sort", error);
  }
  hiddenKeys = optionsFields.map((opt) => opt.fieldKeyJSON);
  infoKeys
    .filter(
      (key) =>
        !hiddenKeys.includes(key) &&
        info[key] &&
        (typeof info[key] !== "object" || info[key][Object.keys(info[key])[0]])
    )
    .forEach((key) => {
      const value = info[key];

      let div = document.createElement("div");
      let h3 = document.createElement("h3");
      let internalDiv = document.createElement("div");
      h3.innerText = key;
      div.appendChild(h3);
      if (typeof value === "object") {
        const valueKeys = Object.keys(value);
        for (let i = 0; i < valueKeys.length; i++) {
          const valueKey = valueKeys[i];
          let h4 = document.createElement("h4");
          let internalDiv = document.createElement("div");
          h4.innerText = valueKey;
          internalDiv.innerText = value[valueKey];
          div.appendChild(h4);
          div.appendChild(internalDiv);
        }
      } else {
        internalDiv.innerText = value;
        div.appendChild(internalDiv);
      }
      div.innerHTML = div.innerHTML.replace(
        /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g,
        (url, id) => {
          return format(youtubeHtml, id);
        }
      );
      container.appendChild(div);
    });
}

function clearContainerDetails() {
  let container = document.querySelector(".details-info");
  container.innerHTML = "";
  return container;
}

/**
 *
 * @param  {string} formatString
 * @param  {...string} args
 * @returns {string}
 */
function format(formatString, ...args) {
  let rep,
    i = 0;
  while ((rep = args.shift())) {
    formatString = formatString.replaceAll(`{${i}}`, rep);
    i++;
  }
  return formatString;
}

const youtubeHtml = `<div class="youtube-container">
<iframe
    class="youtube"
    src="https://www.youtube-nocookie.com/embed/{0}"
    frameborder="0"
    allow="autoplay; encrypted-media"
    allowfullscreen
    >
    </iframe>
</div>`;
