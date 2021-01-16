const BASE_URL = 'https://api.harvardartmuseums.org';
const KEY = 'apikey=cdddd6bb-a8d7-42e4-9789-a17d599859a6';
const APIRESOURCES = {
  RESOURCES: {
    OBJECT: 'object'
  }
}

async function fetchObjects() {
    const url = `${ BASE_URL }/object?${ KEY }`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      return data;
    } catch (error) {
      console.error(error);
    }
  }


  
  fetchObjects().then(x => console.log(x))

async function fetchAllCenturies() {
    const centuryKey = `${ BASE_URL }/century?${ KEY }&size=100&sort=temporalorder`;

    if (localStorage.getItem('centuries')) {
        return JSON.parse(localStorage.getItem('centuries'));
      }
    
    try {
        const response = await fetch(centuryKey);
        const data = await response.json();
        const records = data.records;
        return records;
    } catch (error) {
    console.error(error);
    }
}

async function fetchAllClassifications() {
    const classificationsKey = `${ BASE_URL }/classification?${ KEY }&size=100&sort=name`;

    
    if (localStorage.getItem('classifications')) {
        return JSON.parse(localStorage.getItem('classifications'));
      }

    try {
        const response = await fetch(classificationsKey);
        const data = await response.json();
        const records = data.records;
        return records;
        
    } catch (error) {
        console.error(error);
    }
}

async function prefetchCategoryLists() {
    try {
      const [
        classifications, centuries
      ] = await Promise.all([
        fetchAllClassifications(),
        fetchAllCenturies()
      ]);

      $('.classification-count').text(`(${ classifications.length })`);

    classifications.forEach(classification => {
        $('#select-classification').append(
        `<option value="${classification.name}">${classification.name}</option>`)
    });

$('.century-count').text(`(${ centuries.length })`);

    centuries.forEach(century => {
        $('#select-century').append(
        `<option value="${century.name}">${century.name}</option>`)
    });

    } catch (error) {
      console.error(error);
    }
}

prefetchCategoryLists();

function buildSearchString() {
const classificationValue = $('#select-classification').val();
const centuryValue = $('#select-century').val();
const keywords = $('#keywords').val();
return `${BASE_URL}/object?${KEY}&classifications=${classificationValue}&century=${centuryValue}&keyword=${keywords}`;
}



$('#search').on('submit', async function (event) {
    event.preventDefault();
    onFetchStart();
    try {
    let newURL = buildSearchString();
    let encodedURL = encodeURI(newURL);
      const result = await fetch(encodedURL);
      const data = await result.json();
      const records = data.records;
      console.log(data);
      updatePreview(records, data.info);
    } catch (error) {
      console.error(error);
    } finally {
        onFetchEnd();
    }
  });

  async function someFetchFunction() {
    onFetchStart();
  
    try {
      await fetch();
    } catch (error) {
      console.error(error);
    } finally {
      onFetchEnd();
    }
  }

  function onFetchStart() {
    $('#loading').addClass('active');
  }
  
  function onFetchEnd() {
    $('#loading').removeClass('active');
  }


  function renderPreview(record) { 
    let recordDescription = record.description ? record.description : '';
    let imageURL = record.primaryimageurl ? record.primaryimageurl : '';
    let title = record.title ? record.title : '';
        return $(`<div class="object-preview">
      <a href="#">
        <img src="${imageURL}"/>
        <h3>Record ${title}</h3>
        <h3>${recordDescription}</h3>
      </a>
    </div>`).data('record', record);
  }
  
  function updatePreview(records, info) {
    if(info.next) {
      $('.next').data("url", info.next).attr('disabled', false)
    }
    else {
      $('.next').data("url", null).attr('disabled', true);
    };
    if(info.prev) {
      $('.previous').data("url", info.prev).attr('disabled', false)
      }
    else {
      $('.previous').data("url", null).attr('disabled', true);
  }
    const root = $('#preview');
    const results = $('.results');
    results.empty();
    records.forEach(record => results.append(renderPreview(record)));
}

$('#preview .next, #preview .previous').on('click', async function () {
  try {
    const url = $(this).data("url");
    onFetchStart();
  const resp = await fetch(url);
  const data = await resp.json();
  const records = data.records;
  const info = data.info;
  updatePreview(records, info);
  } catch (error) {
    console.error(error)
  } finally {
    onFetchEnd();
  }
});

$('#preview').on('click', '.object-preview', function (event) {
  event.preventDefault(); 
  let objectPreview = $(this).closest('.object-preview');
  let objectRecord = objectPreview.data('record')
  $('#feature').html(renderFeature(objectRecord))
});

function renderFeature(record) {
  const {
    title,
    dated,
    description,
    style,
    culture,
    technique,
    medium,
    dimensions,
    department,
    division,
    contact,
    creditline,
    images,
    primaryimageurl,
  } = record;
  return $(`<div class="object-feature">
  <header>
  ${ title 
    ? `
      <h3>${ title }</h3>
      `
    : ''
  }
  ${ dated 
    ? `
      <h4>${ dated }</h4>
      `
    : ""
  }
  </header>
  <section class="facts"> 
    ${ factHTML('Description', description, 'description') }
    ${ factHTML('Culture', culture, 'culture') }
    ${ factHTML('Style', style, 'style') }
    ${ factHTML('Technique', technique, 'technique' )}
    ${ factHTML('Medium', medium, 'medium') }
    ${ factHTML('Dimensions', dimensions) }
    ${record.people
      ? record.people.map(function(person) {
          return factHTML('Person', person.displayname, 'person')
        }).join('')
      : ''
    }
    ${ factHTML('Department', department) }
    ${ factHTML('Division', division) }
    ${ factHTML('Contact', `<a target="_blank" href="mailto:${ contact }">${ contact }</a>`) }
    ${ factHTML('Credit', creditline) }
  </section>
  <section class="photos">
  ${ photosHTML(images, primaryimageurl) }
</section>
</div>`);
}

function searchURL(searchType, searchString) {
  return `${ BASE_URL }/object?${ KEY }&${ searchType}=${ searchString }`;
}

function factHTML(title, content, searchTerm = null) {
  if(content === "" || undefined) {
    return "";
  }
  return `
  <span class="title">${ title }</span>
    <span class="content">${searchTerm && content ? `<a href="${ BASE_URL }/object?${ KEY }">${ content }</a>` : content }
    </span>
  `
  }

  function photosHTML(images, primaryimageurl) {
   if(images.length > 0) {
     return images.map(image => `<img src="${image.baseimageurl}" />`);
   } else if(primaryimageurl) {
     return `<img src="${primaryimageurl}/>`
   } else return "";
  }

  $('#feature').on('click', 'a', async function (event) {
    const href = $(this).attr('href');
    if (href.startsWith('mailto:')) {
      return;
    }
    event.preventDefault();
    onFetchStart();
    try {
      let result = await fetch(href);
      let { records, info } = await result.json();
      updatePreview(records, info);
    } catch (error) {
      console.error(error)
    } finally {
      onFetchEnd();
    }
  });