import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
const _ = require('lodash');
const axios = require('axios').default;

import Notiflix from 'notiflix';
Notiflix.Notify.init({
  position: 'right-top',
  fontSize: '16px',
});
import 'notiflix/dist/notiflix-3.2.5.min.css';

const galleryRef = document.querySelector('.gallery');
const lightbox = new SimpleLightbox('.gallery__item', {
  captionsData: 'alt',
  captionDelay: 100,
});
const formRef = document.querySelector('#search-form');
const {
  elements: { searchQuery },
} = formRef;

const PIXABAY_KEY = '31581493-316fbeb9be1137e5ea19fed9b';
const IMAGE_TYPE = 'photo';
const ORIENTATION = 'horizontal';
const SAFESEARCH = true;
const API = 'https://pixabay.com/api/';
const PER_PAGE = 40;
const GAP = 16;
const HEIGHT_FORM = 36;
const UP_TO_GALLERY = HEIGHT_FORM + GAP;

let currentPage = 1;
let pagesCount = 1;
let searchEnded = false;
let firstAsk = false;

searchQuery.style.height = '36px';
searchQuery.style.fontSize = '20px';
searchQuery.style.padding = '10px';
searchQuery.style.borderRadius = '2px 0 0 2px';
searchQuery.style.border = 'none';
searchQuery.style.outline = 'none';

const btnRef = searchQuery.nextElementSibling;
btnRef.style.width = '36px';
btnRef.style.borderRadius = '0 2px 2px 0';
btnRef.style.cursor = 'pointer';
btnRef.style.border = 'none';
btnRef.addEventListener('mouseenter', () => {
  btnRef.style.backgroundColor = '#D1D1D1';
});

btnRef.addEventListener('mouseleave', () => {
  btnRef.style.backgroundColor = '#EFEFEF';
});

function chackBottom(pxToBottom) {
  const toBottom = document.documentElement.clientHeight + pxToBottom;
  const toBottomOfDoc = document.documentElement.getBoundingClientRect().bottom;

  if (toBottomOfDoc < toBottom && !searchEnded) {
    return true;
  }

  return false;
}

async function getGallery() {
  try {
    const searchParams = new URLSearchParams({
      key: PIXABAY_KEY,
      q: searchQuery.value.split(' ').join('+'),
      image_type: IMAGE_TYPE,
      orientation: ORIENTATION,
      safesearch: SAFESEARCH,
      page: currentPage,
      per_page: PER_PAGE,
    });

    const response = await axios.get(`${API}?${searchParams}`);

    if (response.status !== 200) {
      throw new Error(response.status);
    }

    return response.data;
  } catch (error) {
    Notiflix.Notify.failure(error.message);
  }
}

function normalizedQuery(symbol) {
  searchQuery.value = searchQuery.value.trim().toLowerCase();
  if (symbol === ' ') searchQuery.value += ' ';
}

function renderImages(images) {
  let galleryMarkup = '';

  galleryMarkup = [...images]
    .map(
      ({
        largeImageURL,
        webformatURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `<a class="gallery__item" href=${largeImageURL}>
  <img class="gallery__img" src="${webformatURL}" alt="${tags
        .split(', ')
        .join(' ')}" loading="lazy" />
  <div class="info">
    <p class="info__item">
      <b>Likes</b>
      ${likes}
    </p>
    <p class="info__item">
      <b>Views</b>
      ${views}
    </p>
    <p class="info__item">
      <b>Comments</b>
      ${comments}
    </p>
    <p class="info__item">
      <b>Downloads</b>
      ${downloads}
    </p>
  </div>
	</a>`
    )
    .join('');

  galleryRef.insertAdjacentHTML('beforeend', galleryMarkup);

  lightbox.refresh();
}

galleryRef.addEventListener('click', event => {
  event.preventDefault();
});

searchQuery.addEventListener('input', event => {
  normalizedQuery(event.data);
});

formRef.addEventListener('submit', event => {
  event.preventDefault();

  galleryRef.setHTML('');

  pagesCount = 1;
  currentPage = 1;
  searchEnded = false;
  firstAsk = true;

  getGallery()
    .then(response => {
      const { hits: images, totalHits: totalAmount } = response;
      if (images.length === 0) {
        searchEnded = true;
        throw new Error('Sorry, there are no images matching your search query. Please try again.');
      }

      Notiflix.Notify.success(`Hooray! We found ${totalAmount} images.`);

      pagesCount = Math.trunc(totalAmount / PER_PAGE);
      if (totalAmount % PER_PAGE !== 0) pagesCount += 1;

      renderImages(images);
    })
    .catch(error => {
      Notiflix.Notify.failure(error.message);
    });
});

window.addEventListener('load', () => {
  if (firstAsk && !searchEnded) {
    if (chackBottom(0) && pagesCount === currentPage) {
      Notiflix.Notify.info("We're sorry, but you've reached the end of search results.");
      firstAsk = false;
    }
  }
});