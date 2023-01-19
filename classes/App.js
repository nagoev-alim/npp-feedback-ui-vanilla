import axios from 'axios';
import { icons } from 'feather-icons';
import { showNotification } from '../modules/showNotification.js';

export default class App {
  constructor(root) {
    // 🚀 Props
    this.root = root;
    this.reviews = [];
    this.URL = 'https://63c83f46e52516043f4ee625.mockapi.io/reviews';

    // 🚀 Render Skeleton
    this.root.innerHTML = `
      <div class='page'>
        <header>
          <h1 class='h4'>Feedback UI</h1>
        </header>
        <main>
          <form data-form=''>
            <h3 class='h5'>How would you rate your service with us?</h3>
            <ul>
              ${Array.from({ length: 10 }).map((n, i) => i + 1).map(number => `
                <li>
                  <label>
                    <input class='visually-hidden' type='radio' name='rating' value='${number}'>
                     <span class='label'>${number}</span>
                  </label>
                </li>
              `).join('')}
            </ul>
            <div class='field'>
              <input type='text' name='review' placeholder='Write a review'>
              <button type='submit'>Send</button>
            </div>
            <input type='text' name='reviewId' class='visually-hidden'>
          </form>

          <div class='stats'>
            <p data-review-count=''>3 reviews</p>
            <p data-average=''>Average Rating: 9.3</p>
          </div>

          <div data-loader='' class='loader'>
            <div class='dot-wave'>
              <div class='dot-wave__dot'></div>
              <div class='dot-wave__dot'></div>
              <div class='dot-wave__dot'></div>
              <div class='dot-wave__dot'></div>
            </div>
          </div>

          <ul class='reviews hide' data-reviews=''></ul>
        </main>
      </div>
    `;

    // 🚀 Query Selectors
    this.DOM = {
      form: document.querySelector('[data-form]'),
      reviews: document.querySelector('[data-reviews]'),
      loader: document.querySelector('[data-loader]'),
      reviewCount: document.querySelector('[data-review-count]'),
      average: document.querySelector('[data-average]'),
    };

    // 🚀 Events Listeners
    this.fetchData();
    this.DOM.form.addEventListener('submit', this.onSubmit);
    this.DOM.reviews.addEventListener('click', this.onClick);
  }

  //===============================================
  // 🚀 Methods
  //===============================================
  /**
   * @function onSubmit - Form submit event handler
   * @param event
   */
  onSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const { rating, review, reviewId } = Object.fromEntries(new FormData(form).entries());

    if (review.trim().length === 0 || !rating) {
      showNotification('warning', 'Please fill the fields.');
      return;
    }

    if (review.trim().length < 10) {
      showNotification('warning', 'Review must be at least 10 character.');
      return;
    }

    try {
      // Create Review
      if (reviewId.trim().length === 0) {
        const { status, statusText } = await axios.post(`${this.URL}`, { rating, review });

        if (status !== 201 || statusText !== 'Created') {
          showNotification('danger', 'Something went wrong, open developer console.');
          return;
        }

        await this.fetchData();
        showNotification('success', 'Review successfully added.');
      } else {
        // Update Review
        const { status } = await axios.put(`${this.URL}/${reviewId}`, { rating, review });

        if (status !== 200) {
          showNotification('danger', 'Something went wrong, open developer console.');
          return;
        }

        this.reviews = this.reviews.map(i => i.id === reviewId ? { ...i, rating, review } : i);
        this.renderHTML(this.reviews);
        showNotification('success', 'Review successfully updated.');
        this.DOM.form.querySelector('.cancel').remove();
        this.DOM.form.querySelector('button').textContent = 'Submit';
      }
    } catch (e) {
      showNotification('danger', 'Something went wrong, open developer console.');
      console.log(e);
    }

    // Reset form
    form.reset();
  };

  /**
   * @function fetchData - Fetch data from API
   * @return {Promise<void>}
   */
  fetchData = async () => {
    this.DOM.loader.classList.remove('hide');

    try {
      // Get data
      const { data } = await axios.get(`${this.URL}`);
      this.reviews = data;
      // Render items
      this.renderHTML(this.reviews);
      // Show preloader
      this.DOM.loader.classList.add('hide');
    } catch (e) {
      this.DOM.loader.classList.add('hide');
      // this.DOM.list.classList.add('hide');
      showNotification('danger', 'Something went wrong, open developer console.');
      console.log(e);
    }
  };

  /**
   * @function renderHTML - Render items HTML
   * @param data
   */
  renderHTML = (data) => {
    // Clear list
    this.DOM.reviews.innerHTML = ``;
    this.DOM.reviews.classList.remove('hide');
    // Render Items
    for (const { review, rating, id } of data) {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class='rating'>${rating}</div>
        <p>${review}</p>
        <div class='buttons'>
          <button data-edit='${id}'>${icons.edit.toSvg({ color: '#41b6e6' })}</button>
          <button data-delete='${id}'>${icons.x.toSvg({ color: '#ff585d' })}</button>
        </div>`;
      this.DOM.reviews.append(li);
    }

    // Set stats values
    const average =
      data.length === 0
        ? 0
        : data.reduce((acc, { rating }) => acc + parseInt(rating), 0) / data.length;

    this.DOM.reviewCount.innerHTML = `${data.length} reviews`;
    this.DOM.average.innerHTML = `Average Rating: ${average.toFixed(1).replace(/[.,]0$/, '')}`;
  };

  /**
   * @function onClick - Posts list click event handler
   * @param target
   * @return {Promise<void>}
   */
  onClick = async ({ target }) => {
    // Delete post
    if (target.matches('[data-delete]') && confirm('Are you sure?')) {
      const reviewId = target.dataset.delete;
      try {
        const { status, statusText } = await axios.delete(`${this.URL}/${reviewId}`);

        if (status !== 200 || statusText !== 'OK') {
          showNotification('danger', 'Something went wrong, open developer console.');
          return;
        }

        this.reviews = this.reviews.filter(i => i.id !== reviewId);
        this.renderHTML(this.reviews);
        showNotification('success', 'Review successfully deleted.');
      } catch (e) {
        showNotification('danger', 'Something went wrong, open developer console.');
        console.log(e);
      }
    }

    // Edit post
    if (target.matches('[data-edit]')) {
      const review = this.reviews.find(i => i.id === target.dataset.edit);
      this.DOM.form.review.value = review.review;
      this.DOM.form.review.focus();
      this.DOM.form.rating.value = review.rating;
      this.DOM.form.reviewId.value = review.id;
      this.DOM.form.querySelector('button').textContent = 'Update Review';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel update';
      cancelBtn.classList.add('cancel');
      cancelBtn.setAttribute('type', 'button');
      cancelBtn.addEventListener('click', () => {
        this.DOM.form.reset();
        cancelBtn.remove();
        this.DOM.form.querySelector('button').textContent = 'Submit';
      });

      this.DOM.form.appendChild(cancelBtn);
    }
  };
}
