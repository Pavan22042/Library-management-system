const storageKey = 'stacks-library-books';
const starterBooks = [
  { id: 'b1', title: 'The Secret Garden', author: 'Frances Hodgson Burnett', category: 'Fiction', isbn: '978-0-14-132106-4', status: 'Available', dueDate: null },
  { id: 'b2', title: 'A Short History of Nearly Everything', author: 'Bill Bryson', category: 'Science', isbn: '978-0-7679-0818-4', status: 'Checked out', dueDate: '2026-10-24' },
  { id: 'b3', title: 'The Creative Act', author: 'Rick Rubin', category: 'Non-fiction', isbn: '978-0-593-53872-6', status: 'Available', dueDate: null },
  { id: 'b4', title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer', category: 'Science', isbn: '978-1-57131-356-0', status: 'Available', dueDate: null },
  { id: 'b5', title: 'The Book of Delights', author: 'Ross Gay', category: 'Fiction', isbn: '978-1-61219-814-4', status: 'Checked out', dueDate: '2026-10-29' }
];

const list = document.querySelector('#book-list');
const searchInput = document.querySelector('#search-input');
const statusFilter = document.querySelector('#status-filter');
const emptyState = document.querySelector('#empty-state');
const dialog = document.querySelector('#book-dialog');
const form = document.querySelector('#book-form');
let books = loadBooks();
let toastTimer;

function loadBooks() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : starterBooks;
  } catch {
    return starterBooks;
  }
}

function saveBooks() {
  localStorage.setItem(storageKey, JSON.stringify(books));
}

function makeCell(className, text) {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  cell.textContent = text;
  return cell;
}

function renderBooks() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const status = statusFilter.value;
  const filteredBooks = books.filter((book) => {
    const matchesQuery = `${book.title} ${book.author} ${book.isbn}`.toLocaleLowerCase().includes(query);
    return matchesQuery && (status === 'all' || book.status === status);
  });

  list.replaceChildren();
  for (const [index, book] of filteredBooks.entries()) {
    const row = document.createElement('tr');
    const titleCell = document.createElement('td');
    const titleWrap = document.createElement('div');
    const cover = document.createElement('span');
    const titleInfo = document.createElement('div');
    const title = document.createElement('div');
    const author = document.createElement('div');
    cover.className = `book-cover cover-${index % 5}`;
    cover.setAttribute('aria-hidden', 'true');
    cover.textContent = book.title.charAt(0).toLocaleUpperCase();
    titleWrap.className = 'title-cell';
    titleInfo.className = 'title-info';
    title.className = 'book-title';
    title.textContent = book.title;
    author.className = 'book-author';
    author.textContent = book.author;
    titleInfo.append(title, author);
    titleWrap.append(cover, titleInfo);
    titleCell.append(titleWrap);
    row.append(titleCell, makeCell('', book.category), makeCell('', book.isbn));

    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `status ${book.status === 'Available' ? 'available' : 'checked-out'}`;
    badge.textContent = book.status;
    statusCell.append(badge);
    row.append(statusCell);

    const actionCell = document.createElement('td');
    const action = document.createElement('button');
    action.className = 'row-action';
    action.type = 'button';
    action.textContent = book.status === 'Available' ? 'Check out' : 'Return';
    action.setAttribute('aria-label', `${action.textContent} ${book.title}`);
    action.addEventListener('click', () => toggleLoan(book.id));
    actionCell.append(action);
    row.append(actionCell);
    list.append(row);
  }

  emptyState.hidden = filteredBooks.length > 0;
  document.querySelector('#result-count').textContent = `${filteredBooks.length} ${filteredBooks.length === 1 ? 'title' : 'titles'}`;
  document.querySelector('#total-count').textContent = books.length;
  document.querySelector('#available-count').textContent = books.filter((book) => book.status === 'Available').length;
  document.querySelector('#loan-count').textContent = books.filter((book) => book.status === 'Checked out').length;
}

function toggleLoan(bookId) {
  const book = books.find((item) => item.id === bookId);
  if (!book) return;
  const checkingOut = book.status === 'Available';
  book.status = checkingOut ? 'Checked out' : 'Available';
  book.dueDate = checkingOut ? new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) : null;
  saveBooks();
  renderBooks();
  showToast(checkingOut ? `${book.title} checked out for 14 days.` : `${book.title} returned to the catalog.`);
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

document.querySelector('#open-add').addEventListener('click', () => dialog.showModal());
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
searchInput.addEventListener('input', renderBooks);
statusFilter.addEventListener('change', renderBooks);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = new FormData(form);
  const isbn = values.get('isbn').trim();
  if (books.some((book) => book.isbn.toLocaleLowerCase() === isbn.toLocaleLowerCase())) {
    showToast('That ISBN is already in the catalog.');
    return;
  }

  books.unshift({
    id: crypto.randomUUID(),
    title: values.get('title').trim(),
    author: values.get('author').trim(),
    category: values.get('category'),
    isbn,
    status: 'Available',
    dueDate: null
  });
  saveBooks();
  form.reset();
  dialog.close();
  statusFilter.value = 'all';
  searchInput.value = '';
  renderBooks();
  showToast('Book added to the catalog.');
});

document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());
renderBooks();