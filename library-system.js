// Original library-system.js code before any changes

class LibrarySystem {
    constructor() {
        this.books = [];
        this.members = [];
        this.bookIdCounter = 1;
        this.memberIdCounter = 1;
        this.loadFromStorage();
        this.render();
        this.setupEventListeners();
        // Modal state
        this._pendingBorrowBookId = null;
        this._setupBorrowModal();
        this._setupMemberSearch();
    }
    setupEventListeners() {
        const bookForm = document.getElementById('book-form');
        const memberForm = document.getElementById('member-form');
        const bookCancelBtn = document.getElementById('book-cancel-btn');
        const memberCancelBtn = document.getElementById('member-cancel-btn');
        bookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const bookIdInput = document.getElementById('book-id');
            const titleInput = document.getElementById('book-title');
            const authorInput = document.getElementById('book-author');
            const id = bookIdInput.value ? parseInt(bookIdInput.value) : null;
            const title = titleInput.value.trim();
            const author = authorInput.value.trim();
            if (id) {
                this.updateBook(id, title, author);
            }
            else {
                this.addBook(title, author);
            }
            bookForm.reset();
            bookIdInput.value = '';
            bookCancelBtn.style.display = 'none';
        });
        bookCancelBtn.addEventListener('click', () => {
            bookForm.reset();
            document.getElementById('book-id').value = '';
            bookCancelBtn.style.display = 'none';
        });
        memberForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const memberIdInput = document.getElementById('member-id');
            const nameInput = document.getElementById('member-name');
            const id = memberIdInput.value ? parseInt(memberIdInput.value) : null;
            const name = nameInput.value.trim();
            if (id) {
                this.updateMember(id, name);
            }
            else {
                this.addMember(name);
            }
            memberForm.reset();
            memberIdInput.value = '';
            memberCancelBtn.style.display = 'none';
        });
        memberCancelBtn.addEventListener('click', () => {
            memberForm.reset();
            document.getElementById('member-id').value = '';
            memberCancelBtn.style.display = 'none';
        });
        if (document.getElementById('staff-btn')) {
            document.getElementById('staff-btn').addEventListener('click', () => {
                window.location.href = 'staff.html';
            });
        }
        if (document.getElementById('book-history-btn')) {
            document.getElementById('book-history-btn').addEventListener('click', () => {
                window.location.href = 'book-history.html';
            });
        }
    }
    saveToStorage() {
        localStorage.setItem('books', JSON.stringify(this.books));
        localStorage.setItem('members', JSON.stringify(this.members));
        localStorage.setItem('bookIdCounter', this.bookIdCounter.toString());
        localStorage.setItem('memberIdCounter', this.memberIdCounter.toString());
    }
    loadFromStorage() {
        const booksData = localStorage.getItem('books');
        const membersData = localStorage.getItem('members');
        const bookIdCounterData = localStorage.getItem('bookIdCounter');
        const memberIdCounterData = localStorage.getItem('memberIdCounter');
        if (booksData)
            this.books = JSON.parse(booksData);
        if (membersData)
            this.members = JSON.parse(membersData);
        if (bookIdCounterData)
            this.bookIdCounter = parseInt(bookIdCounterData);
        if (memberIdCounterData)
            this.memberIdCounter = parseInt(memberIdCounterData);
    }
    render() {
        this.renderBooks();
        this.renderMembers();
    }
    renderBooks() {
        const tbody = document.querySelector('#books-table tbody');
        tbody.innerHTML = '';
        // Update books count
        const booksCount = document.getElementById('books-count');
        if (booksCount) booksCount.textContent = `Total: ${this.books.length}`;
        this.books.forEach((book, idx) => {
            const tr = document.createElement('tr');
            // Row number
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
            if (book.borrowedByMemberId !== null) {
                const member = this.members.find(m => m.id === book.borrowedByMemberId);
                borrowedByTd.textContent = member ? member.name : 'Unknown';
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
            if (book.borrowedByMemberId === null) {
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
                // Add small red mark
                const redMark = document.createElement('span');
                redMark.className = 'borrowed-mark';
                actionsTd.appendChild(redMark);
            }
            tr.appendChild(actionsTd);
            tbody.appendChild(tr);
        });
    }
    renderMembers() {
        const tbody = document.querySelector('#members-table tbody');
        tbody.innerHTML = '';
        // Update members count
        const membersCount = document.getElementById('members-count');
        if (membersCount) membersCount.textContent = `Total: ${this.members.length}`;
        this.members.forEach((member, idx) => {
            const tr = document.createElement('tr');
            // Row number
            const numberTd = document.createElement('td');
            numberTd.textContent = (idx + 1).toString();
            tr.appendChild(numberTd);
            const nameTd = document.createElement('td');
            nameTd.textContent = member.name;
            tr.appendChild(nameTd);
            const borrowedBooksTd = document.createElement('td');
            // Render each borrowed book as a green span
            const borrowedBooksSpans = member.borrowedBookIds
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
            editBtn.addEventListener('click', () => this.editMember(member.id));
            actionsTd.appendChild(editBtn);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-btn', 'action-btn');
            deleteBtn.addEventListener('click', () => this.deleteMember(member.id));
            actionsTd.appendChild(deleteBtn);
            // Add Return button if member has borrowed books
            if (member.borrowedBookIds.length > 0) {
                const returnBtn = document.createElement('button');
                returnBtn.textContent = 'Return';
                returnBtn.classList.add('action-btn');
                returnBtn.addEventListener('click', () => this.handleMemberReturn(member.id));
                actionsTd.appendChild(returnBtn);
            }
            tr.appendChild(actionsTd);
            tbody.appendChild(tr);
        });
    }

    handleMemberReturn(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member || member.borrowedBookIds.length === 0) return;
        if (member.borrowedBookIds.length === 1) {
            // Only one book, return directly
            this.returnBook(member.borrowedBookIds[0]);
            return;
        }
        // More than one book, show modal
        const modal = document.getElementById('member-return-modal');
        const listDiv = document.getElementById('member-return-list');
        listDiv.innerHTML = '';
        member.borrowedBookIds.forEach(bookId => {
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
        // Select All logic
        document.getElementById('member-return-select-all').onclick = () => {
            listDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        };
        // Cancel logic
        document.getElementById('member-return-cancel').onclick = () => {
            modal.style.display = 'none';
        };
        // Confirm logic
        document.getElementById('member-return-form').onsubmit = (e) => {
            e.preventDefault();
            const checked = Array.from(listDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            checked.forEach(bookId => this.returnBook(Number(bookId)));
            modal.style.display = 'none';
        };
    }
    addBook(title, author) {
        const newBook = {
            id: this.bookIdCounter++,
            title,
            author,
            borrowedByMemberId: null,
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
            if (book.borrowedByMemberId !== null) {
                this.showNotification('Cannot delete a book that is currently borrowed.', 'error');
                return;
            }
            this.books = this.books.filter(b => b.id !== id);
            this.saveToStorage();
            this.renderBooks();
            this.renderMembers();
        }
    }
    editBook(id) {
        const book = this.books.find(b => b.id === id);
        if (book) {
            document.getElementById('book-id').value = book.id.toString();
            document.getElementById('book-title').value = book.title;
            document.getElementById('book-author').value = book.author;
            document.getElementById('book-cancel-btn').style.display = 'inline-block';
        }
    }
    addMember(name) {
        const newMember = {
            id: this.memberIdCounter++,
            name,
            borrowedBookIds: [],
        };
        this.members.push(newMember);
        this.saveToStorage();
        this.renderMembers();
    }
    updateMember(id, name) {
        const member = this.members.find(m => m.id === id);
        if (member) {
            member.name = name;
            this.saveToStorage();
            this.renderMembers();
            this.renderBooks();
        }
    }
    deleteMember(id) {
        const member = this.members.find(m => m.id === id);
        if (member) {
            if (member.borrowedBookIds.length > 0) {
                this.showNotification('Cannot delete a member who currently has borrowed books.', 'error');
                return;
            }
            this.members = this.members.filter(m => m.id !== id);
            this.saveToStorage();
            this.renderMembers();
            this.renderBooks();
        }
    }
    editMember(id) {
        const member = this.members.find(m => m.id === id);
        if (member) {
            document.getElementById('member-id').value = member.id.toString();
            document.getElementById('member-name').value = member.name;
            document.getElementById('member-cancel-btn').style.display = 'inline-block';
        }
    }
    borrowBook(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book || book.borrowedByMemberId !== null) {
            this.showNotification('Book is not available for borrowing.', 'error');
            return;
        }
        // Show modal
        this._pendingBorrowBookId = bookId;
        const modal = document.getElementById('borrow-modal');
        modal.style.display = 'flex';
        const input = document.getElementById('borrow-member-name');
        input.value = '';
        input.focus();
    }

    _confirmBorrow(bookId, memberName) {
        const book = this.books.find(b => b.id === bookId);
        if (!book || book.borrowedByMemberId !== null) {
            this.showNotification('Book is not available for borrowing.', 'error');
            return;
        }
        const member = this.members.find(m => m.name.toLowerCase() === memberName.toLowerCase());
        if (!member) {
            this.showNotification('Member not found.', 'error');
            return;
        }
        book.borrowedByMemberId = member.id;
        member.borrowedBookIds.push(book.id);
        this._logBookHistory({
            userType: 'member',
            name: member.name,
            bookTitle: book.title,
            bookId: book.id,
            borrowedAt: new Date().toISOString(),
            returnedAt: null
        });
        this.saveToStorage();
        this.renderBooks();
        this.renderMembers();
    }

    returnBook(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book || book.borrowedByMemberId === null) {
            this.showNotification('Book is not currently borrowed.', 'error');
            return;
        }
        const member = this.members.find(m => m.id === book.borrowedByMemberId);
        if (member) {
            member.borrowedBookIds = member.borrowedBookIds.filter(id => id !== book.id);
        }
        // Update book history
        this._updateBookHistoryReturn({
            userType: 'member',
            name: member ? member.name : '',
            bookTitle: book.title,
            bookId: book.id,
            returnedAt: new Date().toISOString()
        });
        book.borrowedByMemberId = null;
        this.saveToStorage();
        this.renderBooks();
        this.renderMembers();
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

    _setupBorrowModal() {
        const modal = document.getElementById('borrow-modal');
        const form = document.getElementById('borrow-form');
        const cancelBtn = document.getElementById('borrow-cancel-btn');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('borrow-member-name');
            const memberName = input.value.trim();
            if (!memberName) return;
            modal.style.display = 'none';
            input.value = '';
            if (this._pendingBorrowBookId !== null) {
                this._confirmBorrow(this._pendingBorrowBookId, memberName);
                this._pendingBorrowBookId = null;
            }
        });
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.getElementById('borrow-member-name').value = '';
            this._pendingBorrowBookId = null;
        });
    }

    _setupMemberSearch() {
        const searchInput = document.getElementById('member-search');
        let suggestionBox = null;
        searchInput.addEventListener('input', (e) => {
            const value = searchInput.value.trim().toLowerCase();
            if (suggestionBox) suggestionBox.remove();
            if (!value) return;
            const matches = this.members
                .map((m, idx) => ({
                    idx,
                    name: m.name,
                    display: `${idx + 1}. ${m.name}`
                }))
                .filter(m => m.name.toLowerCase().includes(value));
            if (matches.length === 0) return;
            suggestionBox = document.createElement('div');
            suggestionBox.style.position = 'absolute';
            suggestionBox.style.background = '#fff';
            suggestionBox.style.border = '1px solid #bbb';
            suggestionBox.style.borderRadius = '6px';
            suggestionBox.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            suggestionBox.style.zIndex = 5000;
            suggestionBox.style.marginTop = '2px';
            suggestionBox.style.minWidth = searchInput.offsetWidth + 'px';
            suggestionBox.style.maxHeight = '180px';
            suggestionBox.style.overflowY = 'auto';
            matches.forEach(m => {
                const item = document.createElement('div');
                item.textContent = m.display;
                item.style.padding = '7px 12px';
                item.style.cursor = 'pointer';
                item.addEventListener('mousedown', (ev) => {
                    ev.preventDefault();
                    searchInput.value = '';
                    suggestionBox.remove();
                    this._scrollToAndHighlightMember(m.idx);
                });
                suggestionBox.appendChild(item);
            });
            searchInput.parentNode.appendChild(suggestionBox);
            // Position suggestion box
            const rect = searchInput.getBoundingClientRect();
            suggestionBox.style.left = searchInput.offsetLeft + 'px';
            suggestionBox.style.top = (searchInput.offsetTop + searchInput.offsetHeight) + 'px';
        });
        document.addEventListener('click', (e) => {
            if (suggestionBox && !searchInput.contains(e.target) && !suggestionBox.contains(e.target)) {
                suggestionBox.remove();
            }
        });
    }

    _scrollToAndHighlightMember(idx) {
        const tbody = document.querySelector('#members-table tbody');
        const rows = tbody.querySelectorAll('tr');
        if (idx < 0 || idx >= rows.length) return;
        const row = rows[idx];
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('member-glow');
        setTimeout(() => {
            row.classList.remove('member-glow');
        }, 2000);
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

    returnAllBooksForMember(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member || member.borrowedBookIds.length === 0) return;
        member.borrowedBookIds.forEach(bookId => {
            const book = this.books.find(b => b.id === bookId);
            if (book) book.borrowedByMemberId = null;
        });
        member.borrowedBookIds = [];
        this.saveToStorage();
        this.renderBooks();
        this.renderMembers();
    }
}
window.addEventListener('DOMContentLoaded', () => {
    new LibrarySystem();
});
