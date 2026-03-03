/**
 * BlocklyOverlayManager
 *
 * Manages the translucent "Java code modified" overlay that appears over the
 * Blockly workspace whenever the user has manually edited the generated Java
 * code in the IDE editor.
 *
 * Behaviour
 * ─────────
 * • When Blockly pushes code to the IDE, the exact pushed string is stored in
 *   localStorage as the "last generated code" for that class.
 * • Whenever a Blockly change event fires, detectAndMarkIfModified() compares
 *   the current IDE content to the stored string.  If they differ, the class
 *   is flagged in localStorage (survives reloads) and the overlay is shown.
 * • The overlay intercepts all pointer input over the Blockly canvas.  When
 *   the user clicks it, a confirmation dialog appears:
 *     – Cancel → overlay stays; Java changes are preserved.
 *     – Confirm → flag and cache are cleared, overlay hides, and the current
 *       Blockly workspace is re-pushed to the IDE (overwriting manual edits).
 * • On page reload or file switch, updateForClass() reads the flag from
 *   localStorage and immediately shows the overlay when appropriate.
 */

import LocalStorageManager from './LocalStorageManager.js';

export class BlocklyOverlayManager {

    /** @type {HTMLElement|null} */
    static _overlayEl = null;

    /** @type {boolean} — prevents stacking multiple dialogs */
    static _dialogOpen = false;

    /**
     * Callback that returns the current IDE Java code, or null if unavailable.
     * @type {(() => string|null)|null}
     */
    static _getIDECodeFn = null;

    /**
     * Callback that returns the current class name (without .java extension).
     * @type {(() => string)|null}
     */
    static _getClassNameFn = null;

    /**
     * Callback to trigger Blockly → IDE code regeneration.
     * @type {(() => void)|null}
     */
    static _onBlocksChangeFn = null;

    // ── Initialisation ────────────────────────────────────────────────────────

    /**
     * One-time setup. Must be called after the DOM is ready.
     *
     * @param {object} callbacks
     * @param {() => string|null} callbacks.getIDECode   – returns current IDE code
     * @param {() => string}      callbacks.getClassName – returns active class name
     * @param {() => void}        callbacks.onBlocksChange – regenerates + pushes code
     */
    static init({ getIDECode, getClassName, onBlocksChange }) {
        this._getIDECodeFn     = getIDECode;
        this._getClassNameFn   = getClassName;
        this._onBlocksChangeFn = onBlocksChange;

        this._overlayEl = document.getElementById('blocklyModifiedOverlay');
        if (!this._overlayEl) {
            console.warn('BlocklyOverlayManager: #blocklyModifiedOverlay not found.');
            return;
        }

        this._overlayEl.addEventListener('click',   () => this._handleOverlayClick());
        this._overlayEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this._handleOverlayClick();
            }
        });
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Reads the persisted java-modified flag for the given class and shows or
     * hides the overlay accordingly.  Call this whenever the active class changes
     * (file selected, page loaded).
     *
     * @param {string} className – class name without .java extension
     */
    static updateForClass(className) {
        if (!className) { this.hide(); return; }

        if (LocalStorageManager.isJavaModified(className)) {
            this.show();
        } else {
            this.hide();
        }
    }

    /**
     * Checks whether the IDE currently contains code that differs from what
     * Blockly last generated.  If so, persists the java-modified flag and
     * shows the overlay.
     *
     * Returns `true` when the class is (or just became) java-modified so the
     * caller knows to abort the Blockly→IDE push.
     *
     * @param {string} className – class name without .java extension
     * @returns {boolean}
     */
    static detectAndMarkIfModified(className) {
        if (!className) return false;

        // Already flagged — just make sure the overlay is visible.
        if (LocalStorageManager.isJavaModified(className)) {
            this.show();
            return true;
        }

        // No cache yet → Blockly has never pushed code for this class.
        const lastGenerated = LocalStorageManager.loadLastGeneratedCode(className);
        if (lastGenerated === null) return false;

        const currentCode = this._getIDECodeFn?.();
        if (currentCode === null || currentCode === undefined) return false;

        if (currentCode.trim() !== lastGenerated.trim()) {
            // User has manually edited the IDE – flag and lock.
            LocalStorageManager.setJavaModified(className, true);
            this.show();
            return true;
        }

        return false;
    }

    /** Show the overlay (locks Blockly interaction). */
    static show() {
        this._overlayEl?.classList.add('blockly-modified-overlay--visible');
    }

    /** Hide the overlay (unlocks Blockly interaction). */
    static hide() {
        this._overlayEl?.classList.remove('blockly-modified-overlay--visible');
    }

    /** @returns {boolean} whether the overlay is currently visible */
    static isVisible() {
        return this._overlayEl?.classList.contains('blockly-modified-overlay--visible') ?? false;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    /** Invoked when the user clicks the overlay.  Shows the confirmation dialog. */
    static async _handleOverlayClick() {
        if (this._dialogOpen) return;
        this._dialogOpen = true;

        const confirmed = await this._showConfirmDialog();
        this._dialogOpen = false;

        if (confirmed) {
            const className = this._getClassNameFn?.() ?? '';
            // Clear the persisted flag. The generated-code cache will be refreshed
            // synchronously by onBlocksChange() below before any other JS can run.
            LocalStorageManager.setJavaModified(className, false);
            // Hide overlay before regenerating so the workspace is visible immediately.
            this.hide();
            // Regenerate code from the current Blockly workspace and push to IDE.
            this._onBlocksChangeFn?.();
        }
        // else: do nothing — overlay stays, Java edits are preserved.
    }

    /**
     * Renders and returns a promise-based confirmation dialog that warns the user
     * about losing their manual Java edits.
     *
     * The dialog reuses the `.git-modal-*` CSS classes so it looks consistent
     * with all other B2J dialogs.
     *
     * @returns {Promise<boolean>} true → user confirmed overwrite; false → cancelled
     */
    static _showConfirmDialog() {
        return new Promise((resolve) => {

            // ── Backdrop ──────────────────────────────────────────────────────
            const backdrop = document.createElement('div');
            backdrop.className = 'git-modal-overlay';

            // ── Card ──────────────────────────────────────────────────────────
            const card = document.createElement('div');
            card.className = 'git-modal-card';

            // ── Title ─────────────────────────────────────────────────────────
            const titleEl = document.createElement('h3');
            titleEl.className = 'git-modal-title';
            titleEl.textContent = 'Manuelle Java-Änderungen verwerfen?';
            card.appendChild(titleEl);

            // ── Warning icon row ──────────────────────────────────────────────
            const iconRow = document.createElement('div');
            iconRow.style.cssText = 'display:flex;align-items:center;gap:10px;margin:4px 0 8px;';
            iconRow.innerHTML =
                `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke="#f59e0b" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0">
                   <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                   <line x1="12" y1="9" x2="12" y2="13"/>
                   <line x1="12" y1="17" x2="12.01" y2="17"/>
                 </svg>`;
            card.appendChild(iconRow);

            // ── Body ──────────────────────────────────────────────────────────
            const bodyEl = document.createElement('p');
            bodyEl.className = 'git-modal-body';
            bodyEl.textContent =
                'Du hast den Java-Code manuell bearbeitet. Wenn du jetzt in Blockly ' +
                'eine Änderung bestätigst, werden deine Java-Änderungen unwiderruflich ' +
                'durch den generierten Code überschrieben.';
            card.appendChild(bodyEl);

            const bodyEl2 = document.createElement('p');
            bodyEl2.className = 'git-modal-body';
            bodyEl2.style.marginTop = '6px';
            bodyEl2.textContent = 'Möchtest du die manuellen Java-Änderungen verwerfen und Blockly wieder verwenden?';
            card.appendChild(bodyEl2);

            // ── Buttons ───────────────────────────────────────────────────────
            const btnRow = document.createElement('div');
            btnRow.className = 'git-modal-buttons';

            const close = (val) => {
                backdrop.remove();
                document.removeEventListener('keydown', onKey);
                resolve(val);
            };

            // Cancel — keep Java edits
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'git-modal-btn git-modal-btn--cancel';
            cancelBtn.textContent = 'Abbrechen (Java behalten)';
            cancelBtn.addEventListener('click', () => close(false));
            btnRow.appendChild(cancelBtn);

            // Confirm — overwrite with Blockly
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'git-modal-btn git-modal-btn--submit git-modal-btn--danger';
            confirmBtn.textContent = 'Java-Änderungen verwerfen';
            confirmBtn.addEventListener('click', () => close(true));
            btnRow.appendChild(confirmBtn);

            card.appendChild(btnRow);
            backdrop.appendChild(card);
            document.body.appendChild(backdrop);

            // Keyboard: Escape → cancel, Enter → confirm
            const onKey = (e) => {
                if (e.key === 'Escape') { e.preventDefault(); close(false); }
                if (e.key === 'Enter')  { e.preventDefault(); close(true);  }
            };
            document.addEventListener('keydown', onKey);

            // Focus the safe (cancel) button by default so accidental Enter doesn't
            // immediately destroy edits.
            setTimeout(() => cancelBtn.focus(), 0);
        });
    }
}
