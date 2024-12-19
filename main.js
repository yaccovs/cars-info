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
    const rows = csvText
      .split("\n")
      .map((row) => row.trim())
      .filter((row) => row);

    // הפרדת כותרות
    const headers = rows
      .shift()
      .split(",")
      .map((header) => header.trim());

    // המרת שורות לאובייקטים
    const result = rows.map((row) => {
      const values = row.split(",").map((value) => value.trim());
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
      throw new Error("Failed to fetch the Markdown file");
    }

    // קרא את תוכן הקובץ כטקסט
    const markdown = await response.text();

    // המרת Markdown ל-HTML באמצעות marked.js
    const html = marked.marked(markdown);

    // הצגת ה-HTML בתוך העמוד
    document.querySelector(".header").innerHTML = html;
  } catch (error) {
    console.error("Error:", error);
  }
}

let dataCars, sortInfoJSON, dataFromCSV;
const markdownFile = "./README.md";
// renderMarkdown();

(async () => {
  const url =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXNnGEJ2aU0SK1e-AGNsT4z6TqeQQkg_d6d4N1ROfyJ0JTHuoLjNZ4UVqaAKj999A8ymOGoCczDvx3/pub?gid=1587105429&single=true&output=csv";
  // const url = "./data_cars.csv";
  staticData();
  try {
    const data = await fetchCSVToObject(url);
    dataCars = data;
    console.log(data);
    start();
  } catch (error) {
    console.error("Failed to process CSV:", error);
  }
})();

(async () => {
  const url =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXNnGEJ2aU0SK1e-AGNsT4z6TqeQQkg_d6d4N1ROfyJ0JTHuoLjNZ4UVqaAKj999A8ymOGoCczDvx3/pub?gid=934567918&single=true&output=csv";
  try {
    const response = await fetch(url);
    document.querySelector(".lastChange").textContent =
      "המידע באתר עודכן לאחרונה ב: " + (await response.text());
  } catch (error) {
    console.error("Failed to process CSV:", error);
  }
})();

async function staticData() {
  const url = "./data_cars.csv";
  try {
    const data = await fetchCSVToObject(url);
    dataCars = data;
    console.log(data);
    start();
  } catch (error) {
    console.error("Failed to process CSV:", error);
  }
}

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
  const selectManufactor = document.querySelector(".select-manufactor");
  const prevManufactorValue = selectManufactor.value;
  const selectModel = document.querySelector(".select-model");
  const prevModelValue = selectModel.value;
  const selectYear = document.querySelector(".select-year");
  const prevYearValue = selectYear.value;

  const uniqs = new Set();
  dataCars.forEach((obj) => uniqs.add(obj[optionsFields[0].fieldKeyJSON]));
  optionsFields[0].options = [...uniqs].sort();

  fillSelect(0);
  if (prevManufactorValue !== "") {
    selectManufactor.value = prevManufactorValue;
    selectManufactor.onchange();
    if (prevModelValue !== "") {
      selectModel.value = prevModelValue;
      selectModel.onchange();
      if (prevYearValue !== "") {
        selectYear.value = prevYearValue;
        selectYear.onchange();
      }
    }
  }
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
  const carFilter = dataCars.filter(filterBySelects);
  carFilter.forEach((obj) =>
    uniqs.add(obj[optionsFields[fieldNum].fieldKeyJSON])
  );
  optionsFields[fieldNum].options = [...uniqs].sort();

  fillSelect(fieldNum);
  console.dir(optionsFields[fieldNum]);
  if (
    optionsFields[fieldNum].options.length === 1 &&
    (optionsFields[fieldNum].value === null ||
      typeof optionsFields[fieldNum].value === "undefined")
  ) {
    const value = optionsFields[fieldNum].options[0];
    optionsFields[fieldNum].value = value;
    document.querySelector(`.${optionsFields[fieldNum].field}`).value = value;
    document.querySelector(`.${optionsFields[fieldNum].field}`).onchange();
  }
}

async function fillDetails() {
  let container = clearContainerDetails();

  const info = dataCars.find(filterBySelects);

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

async function getInfoFromGovAPI(resource_id, mispar_rechev) {
  const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resource_id}&filters={%22mispar_rechev%22:%22${mispar_rechev}%22}`;
  try {
    caches.delete(url);
  } catch (error) {
    console.log("Error delete cache:", error);
  }
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

function getDataForNumber(event) {
  event.preventDefault();

  const keys = {
    mispar_rechev: "מספר רכב",
    tozeret_nm: "יצרן",
    kinuy_mishari: "כינוי מסחרי (דגם)",
    shnat_yitzur: "שנת ייצור",
    tokef_dt: "תוקף רישיון",
    sug_delek_nm: "סוג דלק",
  };
  const container = document.querySelector(".number-info");
  container.innerHTML = `<table><thead><tr><th>
  רכב פרטי/מסחרי
  </th></tr></thead>
  <tbody>
  <tr><td><div class="spinner"></div></td></tr></tbody></table>`;
  const mispar_rechev = document.querySelector("#input-checknumber").value;
  getInfoFromGovAPI("053cea08-09bc-40ec-8f7a-156f0677aff3", mispar_rechev)
    .then((data) => {
      insertNumberDataToTable(data);
    })
    .catch((error) => {
      getInfoFromGovAPI("053cea08-09bc-40ec-8f7a-156f0677aff3", mispar_rechev)
        .then((data) => {
          insertNumberDataToTable(data);
        })
        .catch((error) => {
          getInfoFromGovAPI(
            "cf29862d-ca25-4691-84f6-1be60dcb4a1e",
            mispar_rechev
          )
            .then((data) => {
              insertNumberDataToTable(data, "רכב ציבורי");
            })
            .catch((error) => {
              getInfoFromGovAPI(
                "bf9df4e2-d90d-4c0a-a400-19e15af8e95f",
                mispar_rechev
              )
                .then((data) => {
                  insertNumberDataToTable(data, "אופנוע");
                })
                .catch(() => {
                  getInfoFromGovAPI(
                    "851ecab1-0622-4dbe-a6c7-f950cf82abf9",
                    mispar_rechev
                  )
                    .then((data) => {
                      insertNumberDataToTable(data, "רכב בסטטוס ביטול סופי");
                    })
                    .catch(() => {
                      getInfoFromGovAPI(
                        "f6efe89a-fb3d-43a4-bb61-9bf12a9b9099",
                        mispar_rechev
                      )
                        .then((data) => {
                          insertNumberDataToTable(data, "רכב בסטטוס לא פעיל");
                        })
                        .catch(() => {
                          getInfoFromGovAPI(
                            "6f6acd03-f351-4a8f-8ecf-df792f4f573a",
                            mispar_rechev
                          )
                            .then((data) => {
                              insertNumberDataToTable(
                                data,
                                "רכב בסטטוס לא פעיל"
                              );
                            })
                            .catch((error) => {
                              container.innerHTML = "מספר לא קיים או תקלה אחרת";
                              console.error("Error:", error);
                            });
                        });
                    });
                });
            });
        });

      console.error("Error:", error);
    });

  function insertNumberDataToTable(data, title = "רכב פרטי/מסחרי") {
    container.innerHTML = `<table><thead><tr><th>
    ${title}
    </th></tr></thead>
    <tbody>
    <tr><td><div class="spinner"></div></td></tr></tbody></table>`;
    const innerTable = `${Object.keys(keys)
      .filter(
        (key) =>
          data.result.records[0][key] !== null &&
          typeof data.result.records[0][key] !== "undefined"
      )
      .map(
        (key) =>
          `<tr><td>${keys[key]}</td><td>${data.result.records[0][key]}</td></tr>`
      )
      .join("\n")}`;
    container.innerHTML = `<table>
          <thead><tr><th colspan="2">${title}</th></tr></thead>
          <tbody>
          ${innerTable}
          </tbody>
          <tfoot><tr>
          <td class="disclaimer-gov" colspan="2">הנתונים נלקחו מ<a href="https://data.gov.il/organization/ministry_of_transport">DataGov</a></td>
          </tr></tfoot>`;
    const dgamimAPI = `https://data.gov.il/api/3/action/datastore_search?resource_id=d00812f4-58c5-4ce8-b16c-ac13ae52f9d8&filters={%22tozeret_nm%22:%22${data.result.records[0].tozeret_nm}%22}`;
    fetch(dgamimAPI)
      .then((response) => response.json())
      .then((data) => {
        const selectManuf = document.querySelector(".select-manufactor");
        selectManuf.value = data.result.records[0].tozar;
        selectManuf.onchange();
      });
  }
}
