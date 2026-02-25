/**
 * Modal dialog helpers for git operations.
 *
 * Every dialog is a simple overlay built from plain DOM elements so there are
 * no external dependencies.  The dark-theme styling is defined in index.css
 * under the `.git-modal-*` class hierarchy.
 */
export class GitDialog {

  // ── Generic modal builder ──────────────────────────────────────────────

  /**
   * Shows a modal dialog and returns a Promise that resolves with a result
   * object (keys matching each field's `key`), or `null` if the user cancels.
   *
   * @param {Object}   opts
   * @param {string}   opts.title       – dialog title
   * @param {string}   [opts.body]      – optional descriptive text below the title
   * @param {Array}    [opts.fields]    – input field descriptors
   * @param {string}   [opts.submitLabel='OK'] – text on the submit button
   * @param {boolean}  [opts.cancelable=true]  – show a cancel button?
   * @returns {Promise<Object|null>}
   */
  static _showModal({ title, body, fields = [], submitLabel = 'OK', cancelable = true }) {
    return new Promise((resolve) => {

      // ── Overlay ──────────────────────────────────────────────────────
      const overlay = document.createElement('div');
      overlay.className = 'git-modal-overlay';

      const card = document.createElement('div');
      card.className = 'git-modal-card';

      // ── Title ────────────────────────────────────────────────────────
      const titleEl = document.createElement('h3');
      titleEl.className = 'git-modal-title';
      titleEl.textContent = title;
      card.appendChild(titleEl);

      // ── Body text ────────────────────────────────────────────────────
      if (body) {
        const bodyEl = document.createElement('p');
        bodyEl.className = 'git-modal-body';
        bodyEl.textContent = body;
        card.appendChild(bodyEl);
      }

      // ── Input fields ─────────────────────────────────────────────────
      const inputs = {};
      for (const field of fields) {
        const group = document.createElement('div');
        group.className = 'git-modal-field';

        const label = document.createElement('label');
        label.className = 'git-modal-label';
        label.textContent = field.label;
        group.appendChild(label);

        const input = document.createElement('input');
        input.type        = field.type || 'text';
        input.placeholder = field.placeholder || '';
        input.value       = field.value || '';
        input.className   = 'git-modal-input';
        if (field.autofocus) input.autofocus = true;
        group.appendChild(input);

        inputs[field.key] = input;
        card.appendChild(group);
      }

      // ── Button row ───────────────────────────────────────────────────
      const btnRow = document.createElement('div');
      btnRow.className = 'git-modal-buttons';

      /** Helper: close overlay and resolve. */
      const close = (value) => {
        overlay.remove();
        document.removeEventListener('keydown', onKeyDown);
        resolve(value);
      };

      if (cancelable) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'git-modal-btn git-modal-btn--cancel';
        cancelBtn.textContent = 'Abbrechen';
        cancelBtn.addEventListener('click', () => close(null));
        btnRow.appendChild(cancelBtn);
      }

      const submitBtn = document.createElement('button');
      submitBtn.className = 'git-modal-btn git-modal-btn--submit';
      submitBtn.textContent = submitLabel;
      submitBtn.addEventListener('click', () => {
        const result = {};
        for (const [key, input] of Object.entries(inputs)) {
          result[key] = input.value;
        }
        close(result);
      });
      btnRow.appendChild(submitBtn);

      card.appendChild(btnRow);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      // ── Keyboard shortcuts ───────────────────────────────────────────
      const onKeyDown = (e) => {
        if (e.key === 'Escape' && cancelable) close(null);
      };
      document.addEventListener('keydown', onKeyDown);

      // Close when clicking the backdrop
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && cancelable) close(null);
      });

      // Enter in the last input triggers submit
      const inputList = Object.values(inputs);
      const lastInput = inputList[inputList.length - 1];
      if (lastInput) {
        lastInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') submitBtn.click();
        });
      }

      // Auto-focus first input
      const firstInput = inputList[0];
      if (firstInput) {
        requestAnimationFrame(() => firstInput.focus());
      }
    });
  }

  // ── Specific dialogs ──────────────────────────────────────────────────

  /**
   * Prompts for a git clone URL.
   * @returns {Promise<{ url: string }|null>}
   */
  static showCloneDialog() {
    return this._showModal({
      title: 'Git-Repository klonen',
      fields: [{
        key: 'url',
        label: 'Repository-URL',
        placeholder: 'https://benutzer:token@github.com/benutzer/repo.git',
        autofocus: true,
      }],
      submitLabel: 'Klonen',
    });
  }

  /**
   * Prompts for a password / token when the URL has a username but no token.
   * @param {string} username
   * @returns {Promise<{ password: string }|null>}
   */
  static showPasswordDialog(username) {
    return this._showModal({
      title: 'Git-Passwort eingeben',
      fields: [{
        key: 'password',
        label: `Passwort / Token für „${username}"`,
        type: 'password',
        placeholder: 'Passwort oder Personal Access Token',
        autofocus: true,
      }],
      submitLabel: 'Verbinden',
    });
  }

  /**
   * Prompts for a commit message before commit & push.
   * @returns {Promise<{ message: string }|null>}
   */
  static showCommitDialog() {
    return this._showModal({
      title: 'Commit & Push',
      fields: [{
        key: 'message',
        label: 'Commit-Nachricht',
        placeholder: 'Änderungen beschreiben…',
        value: 'B2J: Workspace aktualisiert',
        autofocus: true,
      }],
      submitLabel: 'Commit & Push',
    });
  }

  /**
   * Shows a read-only info dialog with the current repo URL and latest commit.
   * @param {string|null} repoUrl
   * @param {string|null} commitMessage
   * @param {number|null} commitTimestamp  – Unix timestamp in seconds
   */
  static showInfoDialog(repoUrl, commitMessage, commitTimestamp) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'git-modal-overlay';

      const card = document.createElement('div');
      card.className = 'git-modal-card';

      const title = document.createElement('h3');
      title.className = 'git-modal-title';
      title.textContent = 'Repository-Info';
      card.appendChild(title);

      const makeRow = (label, value) => {
        const row = document.createElement('div');
        row.className = 'git-info-row';

        const lbl = document.createElement('div');
        lbl.className = 'git-info-label';
        lbl.textContent = label;
        row.appendChild(lbl);

        const val = document.createElement('div');
        val.className = value ? 'git-info-value' : 'git-info-value git-info-value--muted';
        val.textContent = value || 'Nicht verfügbar';
        row.appendChild(val);

        return row;
      };

      // Format timestamp: "24. Feb 2026, 14:32:07"
      let timestampStr = null;
      if (commitTimestamp) {
        timestampStr = new Date(commitTimestamp * 1000).toLocaleString(
          'de-DE',
          { day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit' },
        );
      }

      card.appendChild(makeRow('Repository', repoUrl ? repoUrl.replace(/^https?:\/\/[^@]*@/, 'https://') : null));
      card.appendChild(makeRow('Letzter Commit', commitMessage));
      card.appendChild(makeRow('Zeitpunkt', timestampStr));

      const btnRow = document.createElement('div');
      btnRow.className = 'git-modal-buttons';

      const closeBtn = document.createElement('button');
      closeBtn.className = 'git-modal-btn git-modal-btn--submit';
      closeBtn.textContent = 'Schließen';
      closeBtn.addEventListener('click', () => { overlay.remove(); resolve(); });
      btnRow.appendChild(closeBtn);
      card.appendChild(btnRow);

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      const onKey = (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          overlay.remove();
          document.removeEventListener('keydown', onKey);
          resolve();
        }
      };
      document.addEventListener('keydown', onKey);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { overlay.remove(); document.removeEventListener('keydown', onKey); resolve(); }
      });

      requestAnimationFrame(() => closeBtn.focus());
    });
  }

  /**
   * Shows a simple informational / error / success message dialog.
   *
   * @param {string} title
   * @param {string} message
   */
  static showMessage(title, message) {
    return this._showModal({
      title,
      body: message,
      fields: [],
      submitLabel: 'OK',
      cancelable: false,
    });
  }

  // ── Loading overlay ───────────────────────────────────────────────────

  /**
   * Shows a non-dismissible loading overlay with a spinner.
   * Returns a function that removes the overlay when called.
   * @param {string} text – e.g. "Klone Repository…"
   * @returns {() => void} dismiss function
   */
  static showLoading(text) {
    const overlay = document.createElement('div');
    overlay.className = 'git-modal-overlay';

    const card = document.createElement('div');
    card.className = 'git-modal-card git-modal-card--loading';

    const spinner = document.createElement('div');
    spinner.className = 'git-spinner';
    card.appendChild(spinner);

    const label = document.createElement('p');
    label.className = 'git-modal-body';
    label.textContent = text;
    card.appendChild(label);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    return () => overlay.remove();
  }
}
