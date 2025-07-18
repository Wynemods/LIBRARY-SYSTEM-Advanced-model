class StaffLibrarySystem {
    constructor() {
        this.books = [];
        this.staff = [];
        this.bookIdCounter = 1;
        this.staffIdCounter = 1;
        this.loadFromStorage();
        this.render();
        this.setupEventListeners();
        this._pendingBorrowBookId = null;
        this._setupBorrowModal();
        this._setupReturnModal();
    }

    saveToStorage() {
        localStorage.setItem('staff_books', JSON.stringify(this.books));
        localStorage.setItem('staff_staff', JSON.stringify(this.staff));
        localStorage.setItem('staff_bookIdCounter', this.bookIdCounter);
        localStorage.setItem('staff_staffIdCounter', this.staffIdCounter);
    }

    loadFromStorage() {
        const booksData = localStorage.getItem('staff_books');
        const staffData = localStorage.getItem('staff_staff');
        const bookIdCounterData = localStorage.getItem('staff_bookIdCounter');
        const staffIdCounterData = localStorage.getItem('staff_staffIdCounter');
        if (booksData) this.books = JSON.parse(booksData);
        if (staffData) this.staff = JSON.parse(staffData);
        if (bookIdCounterData) this.bookIdCounter = parseInt(bookIdCounterData);
        if (staffIdCounterData) this.staffIdCounter = parseInt(staffIdCounterData);
    }

    render() {
        this.renderBooks();
        this.renderStaff();
    }

    renderBooks() {
        const tbody = document.querySelector('#books-table tbody');
        tbody.innerHTML = '';
        this.books.forEach((book, idx) => {
            const tr = document.createElement('tr');
            const numberTd = document.createElement('td');
            numberTd.textContent = (idx + 1).toString();
            tr.appendChild(numberTd);
            const titleTd = document.createElement('td');
            titleTd.textContent = book.title;
            tr.appendChild(titleTd);
            const authorTd = document.createElement('td');
            authorTd.textContent = book.author;
            tr.appendChild(authorTd);
            const borrowedByTd = document.createElement('td');
            if (book.borrowedByStaffId !== null) {
                const staff = this.staff.find(s => s.id === book.borrowedByStaffId);
                borrowedByTd.textContent = staff ? staff.name : 'Unknown';
                borrowedByTd.classList.add('borrowed');
            } else {
                borrowedByTd.textContent = '';
            }
            tr.appendChild(borrowedByTd);
            const actionsTd = document.createElement('td');
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('edit-btn', 'action-btn');
            editBtn.addEventListener('click', () => this.editBook(book.id));
            actionsTd.appendChild(editBtn);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-btn', 'action-btn');
            deleteBtn.addEventListener('click', () => this.deleteBook(book.id));
            actionsTd.appendChild(deleteBtn);
            if (book.borrowedByStaffId === null) {
                const borrowBtn = document.createElement('button');
                borrowBtn.textContent = 'Borrow';
                borrowBtn.classList.add('borrow-btn', 'action-btn');
                borrowBtn.addEventListener('click', () => this.borrowBook(book.id));
                actionsTd.appendChild(borrowBtn);
            } else {
                const returnBtn = document.createElement('button');
                returnBtn.textContent = 'Return';
                returnBtn.classList.add('action-btn');
                returnBtn.addEventListener('click', () => this.returnBook(book.id));
                actionsTd.appendChild(returnBtn);
                const redMark = document.createElement('span');
                redMark.className = 'borrowed-mark';
                actionsTd.appendChild(redMark);
            }
            tr.appendChild(actionsTd);
            tbody.appendChild(tr);
        });
    }

    renderStaff() {
        const tbody = document.querySelector('#staff-table tbody');
        tbody.innerHTML = '';
        this.staff.forEach((staff, idx) => {
            const tr = document.createElement('tr');
            const numberTd = document.createElement('td');
            numberTd.textContent = (idx + 1).toString();
            tr.appendChild(numberTd);
            const nameTd = document.createElement('td');
            nameTd.textContent = staff.name;
            tr.appendChild(nameTd);
            const borrowedBooksTd = document.createElement('td');
            const borrowedBooksSpans = staff.borrowedBookIds
                .map(bookId => {
                    const book = this.books.find(b => b.id === bookId);
                    const span = document.createElement('span');
                    span.textContent = book ? book.title : 'Unknown';
                    span.classList.add('member-borrowed');
                    return span.outerHTML;
                })
                .join(', ');
            borrowedBooksTd.innerHTML = borrowedBooksSpans;
            tr.appendChild(borrowedBooksTd);
            const actionsTd = document.createElement('td');
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('edit-btn', 'action-btn');
            editBtn.addEventListener('click', () => this.editStaff(staff.id));
            actionsTd.appendChild(editBtn);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-btn', 'action-btn');
            deleteBtn.addEventListener('click', () => this.deleteStaff(staff.id));
            actionsTd.appendChild(deleteBtn);
            if (staff.borrowedBookIds.length > 0) {
                const returnBtn = document.createElement('button');
                returnBtn.textContent = 'Return';
                returnBtn.classList.add('action-btn');
                returnBtn.addEventListener('click', () => this.handleStaffReturn(staff.id));
                actionsTd.appendChild(returnBtn);
            }
            tr.appendChild(actionsTd);
            tbody.appendChild(tr);
        });
    }

    setupEventListeners() {
        // Staff form events
        document.getElementById('staff-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('staff-id').value;
            const name = document.getElementById('staff-name').value.trim();
            if (!name) return;
            if (id) {
                this.updateStaff(Number(id), name);
            } else {
                this.addStaff(name);
            }
            document.getElementById('staff-form').reset();
            document.getElementById('staff-cancel-btn').style.display = 'none';
        });
        document.getElementById('staff-cancel-btn').addEventListener('click', () => {
            document.getElementById('staff-form').reset();
            document.getElementById('staff-cancel-btn').style.display = 'none';
        });
        // Book form events
        document.getElementById('book-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('book-id').value;
            const title = document.getElementById('book-title').value.trim();
            const author = document.getElementById('book-author').value.trim();
            if (!title || !author) return;
            if (id) {
                this.updateBook(Number(id), title, author);
            } else {
                this.addBook(title, author);
            }
            document.getElementById('book-form').reset();
            document.getElementById('book-cancel-btn').style.display = 'none';
        });
        document.getElementById('book-cancel-btn').addEventListener('click', () => {
            document.getElementById('book-form').reset();
            document.getElementById('book-cancel-btn').style.display = 'none';
        });
    }

    addBook(title, author) {
        const newBook = {
            id: this.bookIdCounter++,
            title,
            author,
            borrowedByStaffId: null,
        };
        this.books.push(newBook);
        this.saveToStorage();
        this.renderBooks();
    }

    updateBook(id, title, author) {
        const book = this.books.find(b => b.id === id);
        if (book) {
            book.title = title;
            book.author = author;
            this.saveToStorage();
            this.renderBooks();
        }
    }

    deleteBook(id) {
        const book = this.books.find(b => b.id === id);
        if (book) {
            if (book.borrowedByStaffId !== null) {
                this.showNotification('Cannot delete a book that is currently borrowed.', 'error');
                return;
            }
            this.books = this.books.filter(b => b.id !== id);
            this.saveToStorage();
            this.renderBooks();
            this.renderStaff();
        }
    }

    editBook(id) {
        const book = this.books.find(b => b.id === id);
        if (book) {
            document.getElementById('book-id').value = book.id.toString();
            document.getElementById('book-title').value = book.title;
            document.getElementById('book-author').value = book.author;
            // No cancel button for books in staff system
        }
    }

    addStaff(name) {
        const newStaff = {
            id: this.staffIdCounter++,
            name,
            borrowedBookIds: [],
        };
        this.staff.push(newStaff);
        this.saveToStorage();
        this.renderStaff();
    }

    updateStaff(id, name) {
        const staff = this.staff.find(s => s.id === id);
        if (staff) {
            staff.name = name;
            this.saveToStorage();
            this.renderStaff();
            this.renderBooks();
        }
    }

    deleteStaff(id) {
        const staff = this.staff.find(s => s.id === id);
        if (staff) {
            if (staff.borrowedBookIds.length > 0) {
                this.showNotification('Cannot delete a staff who currently has borrowed books.', 'error');
                return;
            }
            this.staff = this.staff.filter(s => s.id !== id);
            this.saveToStorage();
            this.renderStaff();
            this.renderBooks();
        }
    }

    editStaff(id) {
        const staff = this.staff.find(s => s.id === id);
        if (staff) {
            document.getElementById('staff-id').value = staff.id.toString();
            document.getElementById('staff-name').value = staff.name;
            document.getElementById('staff-cancel-btn').style.display = 'inline-block';
        }
    }

    borrowBook(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book || book.borrowedByStaffId !== null) {
            this.showNotification('Book is not available for borrowing.', 'error');
            return;
        }
        // Show modal
        this._pendingBorrowBookId = bookId;
        const modal = document.getElementById('staff-borrow-modal');
        modal.style.display = 'flex';
        const input = document.getElementById('staff-borrow-name');
        input.value = '';
        input.focus();
    }

    _setupBorrowModal() {
        const modal = document.getElementById('staff-borrow-modal');
        const form = document.getElementById('staff-borrow-form');
        const cancelBtn = document.getElementById('staff-borrow-cancel-btn');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('staff-borrow-name');
            const staffName = input.value.trim();
            if (!staffName) return;
            modal.style.display = 'none';
            input.value = '';
            if (this._pendingBorrowBookId !== null) {
                this._confirmBorrow(this._pendingBorrowBookId, staffName);
                this._pendingBorrowBookId = null;
            }
        });
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.getElementById('staff-borrow-name').value = '';
            this._pendingBorrowBookId = null;
        });
    }

    _confirmBorrow(bookId, staffName) {
        const book = this.books.find(b => b.id === bookId);
        if (!book || book.borrowedByStaffId !== null) {
            this.showNotification('Book is not available for borrowing.', 'error');
            return;
        }
        const staff = this.staff.find(s => s.name.toLowerCase() === staffName.toLowerCase());
        if (!staff) {
            this.showNotification('Staff not found.', 'error');
            return;
        }
        book.borrowedByStaffId = staff.id;
        staff.borrowedBookIds.push(book.id);
        this._logBookHistory({
            userType: 'staff',
            name: staff.name,
            bookTitle: book.title,
            bookId: book.id,
            borrowedAt: new Date().toISOString(),
            returnedAt: null
        });
        this.saveToStorage();
        this.renderBooks();
        this.renderStaff();
    }

    returnBook(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book || book.borrowedByStaffId === null) {
            this.showNotification('Book is not currently borrowed.', 'error');
            return;
        }
        const staff = this.staff.find(s => s.id === book.borrowedByStaffId);
        if (staff) {
            staff.borrowedBookIds = staff.borrowedBookIds.filter(id => id !== book.id);
        }
        // Update book history
        this._updateBookHistoryReturn({
            userType: 'staff',
            name: staff ? staff.name : '',
            bookTitle: book.title,
            bookId: book.id,
            returnedAt: new Date().toISOString()
        });
        book.borrowedByStaffId = null;
        this.saveToStorage();
        this.renderBooks();
        this.renderStaff();
    }

    handleStaffReturn(staffId) {
        const staff = this.staff.find(s => s.id === staffId);
        if (!staff || staff.borrowedBookIds.length === 0) return;
        if (staff.borrowedBookIds.length === 1) {
            this.returnBook(staff.borrowedBookIds[0]);
            return;
        }
        // More than one book, show modal
        const modal = document.getElementById('staff-return-modal');
        const listDiv = document.getElementById('staff-return-list');
        listDiv.innerHTML = '';
        staff.borrowedBookIds.forEach(bookId => {
            const book = this.books.find(b => b.id === bookId);
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = bookId;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + (book ? book.title : 'Unknown')));
            listDiv.appendChild(label);
        });
        modal.style.display = 'flex';
        document.getElementById('staff-return-select-all').onclick = () => {
            listDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        };
        document.getElementById('staff-return-cancel').onclick = () => {
            modal.style.display = 'none';
        };
        document.getElementById('staff-return-form').onsubmit = (e) => {
            e.preventDefault();
            const checked = Array.from(listDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            checked.forEach(bookId => this.returnBook(Number(bookId)));
            modal.style.display = 'none';
        };
    }

    showNotification(message, type = '') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = type ? `error ${type === 'error' ? 'error' : 'success'}` : '';
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }

    _logBookHistory(entry) {
        const history = JSON.parse(localStorage.getItem('book_history') || '[]');
        history.push(entry);
        localStorage.setItem('book_history', JSON.stringify(history));
    }

    _updateBookHistoryReturn({userType, name, bookTitle, bookId, returnedAt}) {
        const history = JSON.parse(localStorage.getItem('book_history') || '[]');
        // Find the last matching borrow entry without a returnedAt
        for (let i = history.length - 1; i >= 0; i--) {
            const h = history[i];
            if (h.userType === userType && h.name === name && h.bookTitle === bookTitle && h.bookId === bookId && !h.returnedAt) {
                h.returnedAt = returnedAt;
                break;
            }
        }
        localStorage.setItem('book_history', JSON.stringify(history));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new StaffLibrarySystem();
}); 