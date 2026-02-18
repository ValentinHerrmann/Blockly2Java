import * as Blockly from 'blockly';

export class UiManager {
  /**
   * Reads CSS custom properties and creates the Blockly dark theme.
   * @returns {Blockly.Theme} the configured dark theme
   */
  static setupTheme() {
    const rootStyles = getComputedStyle(document.documentElement);
    const colors = {
      primaryBg: rootStyles.getPropertyValue('--primary-bg').trim(),
      secondaryBg: rootStyles.getPropertyValue('--secondary-bg').trim(),
      tertiaryBg: rootStyles.getPropertyValue('--tertiary-bg').trim(),
      textPrimary: rootStyles.getPropertyValue('--text-primary').trim(),
      textSecondary: rootStyles.getPropertyValue('--text-secondary').trim(),
      textTertiary: rootStyles.getPropertyValue('--text-tertiary').trim(),
      opacityFlyout: parseFloat(rootStyles.getPropertyValue('--opacity-flyout').trim()),
      opacityScrollbar: parseFloat(rootStyles.getPropertyValue('--opacity-scrollbar').trim()),
      opacityMarker: parseFloat(rootStyles.getPropertyValue('--opacity-marker').trim()),
    };

    return Blockly.Theme.defineTheme('dark', {
      'base': Blockly.Themes.Classic,
      'componentStyles': {
        'workspaceBackgroundColour': colors.primaryBg,
        'toolboxBackgroundColour': colors.secondaryBg,
        'toolboxForegroundColour': colors.textPrimary,
        'flyoutBackgroundColour': colors.secondaryBg,
        'flyoutForegroundColour': colors.textPrimary,
        'flyoutOpacity': colors.opacityFlyout,
        'scrollbarColour': colors.tertiaryBg,
        'scrollbarOpacity': colors.opacityScrollbar,
        'insertionMarkerColour': colors.textSecondary,
        'insertionMarkerOpacity': colors.opacityMarker,
        'markerColour': colors.textSecondary,
        'cursorColour': colors.textTertiary,
      }
    });
  }

  /**
   * Sets up the full responsive layout:
   *  - Wide mode  (≥ threshold px): both panes side-by-side with collapse buttons
   *                                  and a draggable divider.
   *  - Narrow mode (< threshold px): tab bar at the top, one pane shown at a time.
   * A ResizeObserver watches the body so the layout adapts whenever the
   * window is resized.
   * @param {Blockly.WorkspaceSvg} workspace
   */
  static setupLayout(workspace) {
    // ── DOM references ───────────────────────────────────────────────────────
    const pageContainer  = document.getElementById('pageContainer');
    const panesContainer = document.getElementById('panesContainer');
    const leftPane       = document.getElementById('leftPane');
    const rightPane      = document.getElementById('rightPane');
    const divider        = document.getElementById('divider');

    // ── Constants ────────────────────────────────────────────────────────────
    // Minimum total width (px) at which both panes fit side-by-side:
    //   left min-width(680) + left margins(2×12) + divider(5)
    //   + right min-width(300) + right margins(2×12) = 1033
    const WIDE_THRESHOLD = 1033;
    const COLLAPSED_PX   = 30;        // collapsed pane strip width

    // ── State ────────────────────────────────────────────────────────────────
    let isNarrow        = false;
    let activeNarrow    = 'left';     // which tab is active in narrow mode
    let leftCollapsed   = false;
    let rightCollapsed  = false;
    let isDragging      = false;

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Trigger a Blockly resize and a synthetic window resize (for the IDE). */
    function notifyResize() {
      Blockly.svgResize(workspace);
      window.dispatchEvent(new Event('resize'));
    }

    /** Switch to wide mode (both panes visible). */
    function enterWideMode() {
      isNarrow = false;
      pageContainer.classList.remove('narrow-mode', 'show-left', 'show-right');
      // Restore pane display in case they were hidden by narrow mode
      leftPane.style.display  = '';
      rightPane.style.display = '';
      // Re-apply any existing collapse state classes
      pageContainer.classList.toggle('left-collapsed',  leftCollapsed);
      pageContainer.classList.toggle('right-collapsed', rightCollapsed);
      setTimeout(notifyResize, 50);
    }

    /** Switch to narrow mode (one pane at a time, tab bar shown). */
    function enterNarrowMode() {
      isNarrow = true;
      // Remove wide-mode collapse classes – no collapse in narrow mode
      pageContainer.classList.remove('left-collapsed', 'right-collapsed');
      leftCollapsed  = false;
      rightCollapsed = false;
      // Reset any flex overrides left by the divider drag
      leftPane.style.flex  = '';
      rightPane.style.flex = '';
      pageContainer.classList.add('narrow-mode');
      showNarrowPane(activeNarrow);
    }

    /** Show one pane in narrow mode. */
    function showNarrowPane(pane) {
      activeNarrow = pane;
      pageContainer.classList.toggle('show-left',  pane === 'left');
      pageContainer.classList.toggle('show-right', pane === 'right');
      document.querySelectorAll('.narrow-tab').forEach(btn => {
        btn.classList.toggle('narrow-tab--active', btn.dataset.pane === pane);
      });
      setTimeout(notifyResize, 50);
    }

    /** Toggle collapse/expand of a pane in wide mode. */
    function toggleCollapse(pane) {
      if (isNarrow) return;

      if (pane === 'left') {
        leftCollapsed = !leftCollapsed;
        // Cannot collapse both — expand right if it was collapsed
        if (leftCollapsed && rightCollapsed) {
          rightCollapsed = false;
          pageContainer.classList.remove('right-collapsed');
        }
        pageContainer.classList.toggle('left-collapsed', leftCollapsed);
      } else {
        rightCollapsed = !rightCollapsed;
        if (rightCollapsed && leftCollapsed) {
          leftCollapsed = false;
          pageContainer.classList.remove('left-collapsed');
        }
        pageContainer.classList.toggle('right-collapsed', rightCollapsed);
      }

      // Reset any divider-drag flex overrides so CSS takes control
      leftPane.style.flex  = '';
      rightPane.style.flex = '';

      // Update collapse button glyphs
      updateCollapseButtons();

      setTimeout(notifyResize, 300); // wait for CSS transition
    }

    /** SVG chevron helpers (pointing left / right). */
    const chevSvg = (dir) =>
      `<svg class="chev-svg" width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" fill="none" aria-hidden="true">` +
      `<use href="#chev-${dir}"/></svg>`;

    /** Update collapse-button icons to reflect current collapse state. */
    function updateCollapseButtons() {
      document.querySelectorAll('.pane-collapse-btn').forEach(btn => {
        const side = btn.dataset.pane;
        if (side === 'left') {
          // ◀ collapse,  ▶ expand
          btn.innerHTML = chevSvg(leftCollapsed ? 'right' : 'left');
          btn.title = leftCollapsed ? 'Leiste ausklappen' : 'Leiste einklappen';
        } else {
          // ▶ collapse,  ◀ expand
          btn.innerHTML = chevSvg(rightCollapsed ? 'left' : 'right');
          btn.title = rightCollapsed ? 'Leiste ausklappen' : 'Leiste einklappen';
        }
      });
    }

    // ── Layout update (called on every resize) ───────────────────────────────

    let layoutChanging = false;
    function updateLayout() {
      if (layoutChanging) return;
      const narrow = window.innerWidth < WIDE_THRESHOLD;
      if (narrow === isNarrow) return; // no mode change
      layoutChanging = true;
      if (narrow) {
        enterNarrowMode();
      } else {
        enterWideMode();
      }
      requestAnimationFrame(() => { layoutChanging = false; });
    }

    // ── Draggable divider (wide mode only) ───────────────────────────────────

    // Values cached at mousedown so mousemove never forces a layout reflow.
    let dragCache = null;
    let rafPending = false;

    divider.addEventListener('mousedown', (e) => {
      if (isNarrow) return;
      isDragging = true;
      panesContainer.classList.add('is-dragging');
      document.body.style.cursor     = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();

      // Cache everything that requires a layout read right now, once.
      const lStyle = getComputedStyle(leftPane);
      const rStyle = getComputedStyle(rightPane);
      const lMargin = parseInt(lStyle.marginLeft)  + parseInt(lStyle.marginRight);
      const rMargin = parseInt(rStyle.marginLeft)  + parseInt(rStyle.marginRight);
      const minL    = (parseInt(lStyle.minWidth) || 200) + lMargin;
      const minR    = (parseInt(rStyle.minWidth) || 200) + rMargin;
      const rect    = panesContainer.getBoundingClientRect();

      dragCache = { lMargin, rMargin, minL, minR, rect };
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging || !dragCache) return;

      const { lMargin, rMargin, minL, minR, rect } = dragCache;
      const DIVIDER_W      = 5;
      const containerWidth = rect.width;
      const newLeftWidth   = e.clientX - rect.left;
      const maxL           = containerWidth - minR - DIVIDER_W;

      if (newLeftWidth < minL || newLeftWidth > maxL) return;

      leftPane.style.flex  = `0 0 ${newLeftWidth - lMargin}px`;
      rightPane.style.flex = `0 0 ${containerWidth - newLeftWidth - DIVIDER_W - rMargin}px`;

      // Throttle the (expensive) Blockly resize to once per animation frame.
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          Blockly.svgResize(workspace);
          rafPending = false;
        });
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        dragCache  = null;
        panesContainer.classList.remove('is-dragging');
        document.body.style.cursor     = '';
        document.body.style.userSelect = '';
        // Final resize after releasing the mouse.
        Blockly.svgResize(workspace);
      }
    });

    // ── Button event listeners ───────────────────────────────────────────────

    document.querySelectorAll('.pane-collapse-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent triggering the pane-level click listener
        toggleCollapse(btn.dataset.pane);
      });
    });

    // Clicking anywhere on a collapsed pane re-opens it.
    leftPane.addEventListener('click', () => {
      if (leftCollapsed) toggleCollapse('left');
    });
    rightPane.addEventListener('click', () => {
      if (rightCollapsed) toggleCollapse('right');
    });

    document.querySelectorAll('.narrow-tab').forEach(btn => {
      btn.addEventListener('click', () => showNarrowPane(btn.dataset.pane));
    });

    // ── ResizeObserver – swap modes dynamically ──────────────────────────────

    const ro = new ResizeObserver(() => updateLayout());
    ro.observe(document.documentElement);

    // ── Initial layout ───────────────────────────────────────────────────────
    updateLayout();
  }

  /**
   * Shows or hides the output/code pane.
   * @param {boolean} show - true to expand the pane, false to collapse it
   */
  static showCodeDiv(show) {
    const pane = document.getElementById('outputPane');
    if (!pane) return;
    if (show) {
      pane.style.flex = '0 0 500px';
      pane.style.margin = '10px';
    } else {
      pane.style.flex = '0px';
      pane.style.margin = '1px';
    }
  }
}
