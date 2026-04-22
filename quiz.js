document.addEventListener("DOMContentLoaded", () => {
  const quizForm = document.querySelector("#quizForm");
  if (!quizForm) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const quizSteps = Array.from(quizForm.querySelectorAll("[data-quiz-step]"));
  if (!quizSteps.length) {
    return;
  }

  const quizShell = document.querySelector("[data-quiz-shell]");
  const startButton = document.querySelector("[data-quiz-start]");
  const introBlock = startButton ? startButton.closest(".quiz-intro") : null;
  const prevButton = quizForm.querySelector("[data-quiz-prev]");
  const nextButton = quizForm.querySelector("[data-quiz-next]");
  const submitButton = quizForm.querySelector("[data-quiz-submit]");
  const stepCounter = quizForm.querySelector("[data-quiz-current-step]");
  const stepTotal = quizForm.querySelector("[data-quiz-total-steps]");
  const progressTrack = quizForm.querySelector(".quiz-progress-track");
  const progressFill = quizForm.querySelector("[data-quiz-progress-fill]");
  const stepError = quizForm.querySelector("#quizStepError");
  const liveRegion = quizForm.querySelector("#quizLiveRegion");
  const responseIdField = quizForm.querySelector("#responseId");
  const utmSourceField = quizForm.querySelector("#utmSource");
  const utmMediumField = quizForm.querySelector("#utmMedium");
  const utmCampaignField = quizForm.querySelector("#utmCampaign");
  const landingPageField = quizForm.querySelector("#landingPage");
  const referrerUrlField = quizForm.querySelector("#referrerUrl");
  const startedAtField = quizForm.querySelector("#startedAt");
  const submittedAtField = quizForm.querySelector("#submittedAt");
  const answerQ1Field = quizForm.querySelector("#answerQ1OcasionPrincipal");
  const answerQ2Field = quizForm.querySelector("#answerQ2BeneficiosClave");
  const answerQ3Field = quizForm.querySelector("#answerQ3TonoPresentacion");
  const answerQ4Field = quizForm.querySelector("#answerQ4RepertorioBase");
  const answerQ5Field = quizForm.querySelector("#answerQ5CancionesReconocidas");
  const answerQ6Field = quizForm.querySelector("#answerQ6PapelMusica");
  const answerQ7Field = quizForm.querySelector("#answerQ7AperturaIdiomas");
  const answerQ8Field = quizForm.querySelector("#answerQ8FactoresRechazo");
  const answerQ9Field = quizForm.querySelector("#answerQ9CancionesReferencia");
  const answerQ10Field = quizForm.querySelector("#answerQ10ReferentesEstilo");
  const answersJsonField = quizForm.querySelector("#answersJson");
  const ocasionOtraField = quizForm.querySelector("#ocasionOtra");
  const beneficioOtroTextoField = quizForm.querySelector("#beneficioOtroTexto");
  const repertorioOtroTextoField = quizForm.querySelector("#repertorioOtroTexto");
  const rechazoOtroTextoField = quizForm.querySelector("#rechazoOtroTexto");
  const cancionesReferenciaField = quizForm.querySelector("#cancionesReferencia");
  const referentesEstiloField = quizForm.querySelector("#referentesEstilo");

  const conditionalFields = Array.from(quizForm.querySelectorAll("[data-conditional-name]"));
  const persistableFields = Array.from(quizForm.querySelectorAll("input, textarea, select"))
    .filter((field) => field.id && field.type !== "hidden");

  const draftStorageKey = "armandefica_quiz_music_draft_v1";
  const lastSubmissionKey = "armandefica_last_submission";
  const stepTransitionDuration = prefersReducedMotion ? 0 : 260;
  const introTransitionDuration = prefersReducedMotion ? 0 : 220;
  const shellEnterDuration = prefersReducedMotion ? 0 : 320;
  const stepCount = quizSteps.length;
  let currentStep = 0;
  let quizStarted = !quizShell;
  let isTransitioning = false;
  let isSubmitting = false;
  let draftSaveTimer = null;
  let lastSavedDraftPayload = "";
  const questionTwoCheckboxNames = [
    "beneficio_recuerdo_bonito",
    "beneficio_admiracion_calidad_vocal",
    "beneficio_canciones_reconocidas",
    "beneficio_ambiente_agradable",
    "beneficio_sensacion_especial",
    "beneficio_algo_diferente",
    "beneficio_otro"
  ];
  const questionFourCheckboxNames = [
    "repertorio_baladas_boleros_romanticos",
    "repertorio_peliculas_musicales",
    "repertorio_opera_musica_clasica",
    "repertorio_canciones_solemnes",
    "repertorio_otro"
  ];
  const questionEightCheckboxNames = [
    "rechazo_no_reconozca_canciones",
    "rechazo_demasiado_serio_distante",
    "rechazo_demasiado_comun_predecible",
    "rechazo_lenta_aburrida",
    "rechazo_no_transmita_emocion",
    "rechazo_no_encaje_evento",
    "rechazo_otro"
  ];

  if (stepTotal) {
    stepTotal.textContent = `${stepCount}`;
  }

  const buildFallbackResponseId = () => {
    const randomPart = Math.random().toString(36).slice(2, 12);
    return `resp_${Date.now().toString(36)}_${randomPart}`;
  };

  const generateResponseId = () => {
    // response_id: use native UUID when available, with a stable fallback.
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return buildFallbackResponseId();
  };

  const initializeAnalyticsFields = () => {
    // Hidden analytics fields for Netlify Forms: UTMs, landing, referrer and timestamps.
    const searchParams = new URLSearchParams(window.location.search);

    if (responseIdField && !responseIdField.value) {
      responseIdField.value = generateResponseId();
    }

    if (startedAtField && !startedAtField.value) {
      startedAtField.value = new Date().toISOString();
    }

    if (utmSourceField) {
      utmSourceField.value = searchParams.get("utm_source") || "";
    }

    if (utmMediumField) {
      utmMediumField.value = searchParams.get("utm_medium") || "";
    }

    if (utmCampaignField) {
      utmCampaignField.value = searchParams.get("utm_campaign") || "";
    }

    if (landingPageField) {
      landingPageField.value = window.location.href;
    }

    if (referrerUrlField) {
      referrerUrlField.value = document.referrer || "";
    }
  };

  const normalizeText = (value) => value.trim().replace(/\s+/g, " ");

  const getCheckedRadioValue = (name) => {
    const checked = quizForm.querySelector(`input[type="radio"][name="${name}"]:checked`);
    return checked ? checked.value : "";
  };

  const getCheckedCheckboxNames = (names) => names.filter((name) => {
    const checkbox = quizForm.querySelector(`input[type="checkbox"][name="${name}"]`);
    return Boolean(checkbox && checkbox.checked);
  });

  const getConditionalValue = (field) => (field ? normalizeText(field.value) : "");

  const toPipeSeparated = (values) => values.join("|");

  const setHiddenValue = (field, value) => {
    if (field) {
      field.value = value;
    }
  };

  const buildSubmissionSummary = () => {
    const q1Value = getCheckedRadioValue("ocasion_principal");
    const q1Other = getConditionalValue(ocasionOtraField);
    const q1Answer = q1Value === "otra" && q1Other ? `otra:${q1Other}` : q1Value;

    const q2Selections = getCheckedCheckboxNames(questionTwoCheckboxNames);
    const q2Other = getConditionalValue(beneficioOtroTextoField);
    if (q2Selections.includes("beneficio_otro") && q2Other) {
      q2Selections.push(`beneficio_otro_texto:${q2Other}`);
    }

    const q4Selections = getCheckedCheckboxNames(questionFourCheckboxNames);
    const q4Other = getConditionalValue(repertorioOtroTextoField);
    if (q4Selections.includes("repertorio_otro") && q4Other) {
      q4Selections.push(`repertorio_otro_texto:${q4Other}`);
    }

    const q8Selections = getCheckedCheckboxNames(questionEightCheckboxNames);
    const q8Other = getConditionalValue(rechazoOtroTextoField);
    if (q8Selections.includes("rechazo_otro") && q8Other) {
      q8Selections.push(`rechazo_otro_texto:${q8Other}`);
    }

    return {
      respuesta_q1_ocasion_principal: q1Answer,
      respuesta_q2_beneficios_clave: toPipeSeparated(q2Selections),
      respuesta_q3_tono_presentacion: getCheckedRadioValue("tono_presentacion"),
      respuesta_q4_repertorio_base: toPipeSeparated(q4Selections),
      respuesta_q5_canciones_reconocidas: getCheckedRadioValue("cantidad_canciones_reconocidas"),
      respuesta_q6_papel_musica: getCheckedRadioValue("papel_musica_evento"),
      respuesta_q7_apertura_idiomas: getCheckedRadioValue("apertura_idiomas"),
      respuesta_q8_factores_rechazo: toPipeSeparated(q8Selections),
      respuesta_q9_canciones_referencia: getConditionalValue(cancionesReferenciaField),
      respuesta_q10_referentes_estilo: getConditionalValue(referentesEstiloField)
    };
  };

  const syncSummaryFields = () => {
    const summary = buildSubmissionSummary();

    setHiddenValue(answerQ1Field, summary.respuesta_q1_ocasion_principal);
    setHiddenValue(answerQ2Field, summary.respuesta_q2_beneficios_clave);
    setHiddenValue(answerQ3Field, summary.respuesta_q3_tono_presentacion);
    setHiddenValue(answerQ4Field, summary.respuesta_q4_repertorio_base);
    setHiddenValue(answerQ5Field, summary.respuesta_q5_canciones_reconocidas);
    setHiddenValue(answerQ6Field, summary.respuesta_q6_papel_musica);
    setHiddenValue(answerQ7Field, summary.respuesta_q7_apertura_idiomas);
    setHiddenValue(answerQ8Field, summary.respuesta_q8_factores_rechazo);
    setHiddenValue(answerQ9Field, summary.respuesta_q9_canciones_referencia);
    setHiddenValue(answerQ10Field, summary.respuesta_q10_referentes_estilo);
    setHiddenValue(answersJsonField, JSON.stringify(summary));
  };

  const getStepTitle = (stepIndex) => {
    const step = quizSteps[stepIndex];
    return step && step.dataset.stepTitle ? step.dataset.stepTitle : `Paso ${stepIndex + 1}`;
  };

  const setStepError = (message) => {
    if (stepError) {
      stepError.textContent = message;
    }
  };

  const setNavigationState = (options = {}) => {
    const { disabled = false } = options;

    if (nextButton) {
      nextButton.disabled = disabled;
    }

    if (prevButton) {
      prevButton.disabled = disabled;
    }

    if (submitButton) {
      submitButton.disabled = disabled;
    }

    if (startButton) {
      startButton.disabled = disabled;
    }
  };

  const setQuestionError = (step, message) => {
    const errorTarget = step.querySelector("[data-question-error]");
    if (errorTarget) {
      errorTarget.textContent = message;
    }
  };

  const clearQuestionError = (step) => {
    setQuestionError(step, "");
  };

  const clearStepInvalidState = (step) => {
    const inputs = step.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      input.setAttribute("aria-invalid", "false");
    });
  };

  const setProgressValue = () => {
    const progressValue = Math.round(((currentStep + 1) / stepCount) * 100);
    if (progressFill) {
      progressFill.style.width = `${progressValue}%`;
    }
    if (progressTrack) {
      progressTrack.setAttribute("aria-valuenow", `${progressValue}`);
    }
  };

  const updateConditionalFields = () => {
    // "Otra/Otro" logic: show or hide the linked field, require it only when visible, clear it when hidden.
    conditionalFields.forEach((field) => {
      const name = field.dataset.conditionalName;
      const expectedValue = field.dataset.conditionalValue;
      if (!name || !expectedValue) {
        return;
      }

      const inputs = Array.from(quizForm.querySelectorAll(`input[name="${name}"]`));
      const shouldShow = inputs.some((input) => input.checked && input.value === expectedValue);
      const wrapper = field.closest(".quiz-conditional") || field;

      wrapper.hidden = !shouldShow;
      field.disabled = !shouldShow;
      field.required = shouldShow;

      if (!shouldShow) {
        field.value = "";
        field.required = false;
        field.setAttribute("aria-invalid", "false");
      }
    });

    syncSummaryFields();
  };

  const shouldUpdateConditionalFieldsFor = (target) => {
    if (!(target instanceof HTMLInputElement) || conditionalFields.length === 0) {
      return false;
    }

    if (target.type !== "radio" && target.type !== "checkbox") {
      return false;
    }

    return conditionalFields.some((field) => field.dataset.conditionalName === target.name);
  };

  const getValidationResult = (step) => {
    const questionType = step.dataset.questionType || "info";
    const requiredMessage = step.dataset.requiredMessage || "Completa este paso para continuar.";

    if (questionType === "info" || questionType === "optional-text") {
      return {
        isValid: true,
        message: "",
        focusTarget: null
      };
    }

    if (questionType === "single" || questionType === "scale") {
      const radios = Array.from(step.querySelectorAll("input[type='radio']"));
      const checked = radios.find((radio) => radio.checked);

      if (!checked) {
        return {
          isValid: false,
          message: requiredMessage,
          focusTarget: radios[0] || null
        };
      }

      const requiredTextId = checked.dataset.requiresText;
      if (requiredTextId) {
        const requiredTextField = step.querySelector(`#${requiredTextId}`);
        if (requiredTextField && requiredTextField.value.trim() === "") {
          return {
            isValid: false,
            message: requiredTextField.dataset.requiredMessage || "Especifica tu respuesta para continuar.",
            focusTarget: requiredTextField
          };
        }
      }

      return {
        isValid: true,
        message: "",
        focusTarget: null
      };
    }

    if (questionType === "multi-limit") {
      const checkboxes = Array.from(step.querySelectorAll("input[type='checkbox']"));
      const checkedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
      const minSelect = Number(step.dataset.minSelect || 1);
      const maxSelect = Number(step.dataset.maxSelect || checkboxes.length);

      if (checkedCount < minSelect) {
        return {
          isValid: false,
          message: requiredMessage,
          focusTarget: checkboxes[0] || null
        };
      }

      if (checkedCount > maxSelect) {
        return {
          isValid: false,
          message: step.dataset.maxMessage || `Puedes seleccionar hasta ${maxSelect} opciones.`,
          focusTarget: checkboxes[0] || null
        };
      }

      const checkedWithText = checkboxes.find((checkbox) => checkbox.checked && checkbox.dataset.requiresText);
      if (checkedWithText) {
        const requiredTextId = checkedWithText.dataset.requiresText;
        const requiredTextField = requiredTextId ? step.querySelector(`#${requiredTextId}`) : null;
        if (requiredTextField && requiredTextField.value.trim() === "") {
          return {
            isValid: false,
            message: requiredTextField.dataset.requiredMessage || "Especifica tu respuesta para continuar.",
            focusTarget: requiredTextField
          };
        }
      }

      return {
        isValid: true,
        message: "",
        focusTarget: null
      };
    }

    if (questionType === "text") {
      const textField = step.querySelector("textarea, input[type='text'], input[type='email'], input[type='url']");
      if (!textField) {
        return {
          isValid: true,
          message: "",
          focusTarget: null
        };
      }

      if (textField.value.trim() === "") {
        return {
          isValid: false,
          message: requiredMessage,
          focusTarget: textField
        };
      }

      return {
        isValid: true,
        message: "",
        focusTarget: null
      };
    }

    return {
      isValid: true,
      message: "",
      focusTarget: null
    };
  };

  const validateStep = (step, options = {}) => {
    const { focusFirstInvalid = true, silent = false } = options;

    updateConditionalFields();
    clearQuestionError(step);
    clearStepInvalidState(step);

    const result = getValidationResult(step);

    if (!result.isValid) {
      if (!silent) {
        setStepError(result.message);
        setQuestionError(step, result.message);
      }

      if (result.focusTarget) {
        result.focusTarget.setAttribute("aria-invalid", "true");
      }

      if (focusFirstInvalid && result.focusTarget) {
        result.focusTarget.focus();
      }

      return false;
    }

    if (!silent) {
      setStepError("");
    }

    return true;
  };

  const focusFirstFieldInStep = () => {
    const firstInteractive = quizSteps[currentStep].querySelector("input, select, textarea, button");
    if (firstInteractive) {
      firstInteractive.focus();
    }
  };

  const scrollToFormTop = () => {
    quizForm.scrollIntoView({
      block: "start",
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  };

  const updateNextButtonLabel = () => {
    if (!nextButton) {
      return;
    }
    nextButton.textContent = "Siguiente pregunta";
  };

  const updateStepState = (options = {}) => {
    const { announce = true, focusFirstField = false } = options;

    quizSteps.forEach((step, index) => {
      const isActive = index === currentStep;
      step.classList.toggle("is-active", isActive);
      step.hidden = !isActive;
      step.setAttribute("aria-hidden", String(!isActive));

      if (!isActive) {
        step.classList.remove("is-leaving");
        clearQuestionError(step);
        clearStepInvalidState(step);
      }
    });

    if (nextButton) {
      nextButton.hidden = currentStep === stepCount - 1;
    }

    if (prevButton) {
      prevButton.hidden = currentStep === 0;
    }

    if (submitButton) {
      submitButton.hidden = currentStep !== stepCount - 1;
    }

    if (stepCounter) {
      stepCounter.textContent = `${currentStep + 1}`;
    }

    updateNextButtonLabel();
    updateConditionalFields();
    setProgressValue();
    setStepError("");

    if (announce && liveRegion) {
      liveRegion.textContent = `Paso ${currentStep + 1} de ${stepCount}: ${getStepTitle(currentStep)}.`;
    }

    if (focusFirstField) {
      focusFirstFieldInStep();
    }
  };

  const moveToStep = (stepIndex, options = {}) => {
    if (stepIndex < 0 || stepIndex > stepCount - 1 || stepIndex === currentStep || isTransitioning) {
      return;
    }

    const { smoothScroll = false, focusFirstField = true } = options;
    const previousStep = quizSteps[currentStep];

    const commitStepChange = () => {
      currentStep = stepIndex;
      updateStepState({ announce: true, focusFirstField });

      if (smoothScroll) {
        scrollToFormTop();
      }

      scheduleDraftSave({ immediate: true });
    };

    if (!previousStep || stepTransitionDuration === 0) {
      commitStepChange();
      return;
    }

    isTransitioning = true;
    setNavigationState({ disabled: true });
    previousStep.classList.add("is-leaving");

    window.setTimeout(() => {
      previousStep.classList.remove("is-leaving");
      commitStepChange();
      isTransitioning = false;
      setNavigationState({ disabled: false });
    }, stepTransitionDuration);
  };

  const persistDraft = (options = {}) => {
    const { force = false } = options;
    const payload = {
      step: currentStep,
      values: {}
    };

    persistableFields.forEach((field) => {
      if (field.type === "checkbox" || field.type === "radio") {
        payload.values[field.id] = field.checked;
        return;
      }
      payload.values[field.id] = field.value;
    });

    let serializedPayload = "";
    try {
      serializedPayload = JSON.stringify(payload);
    } catch (error) {
      return;
    }

    if (!force && serializedPayload === lastSavedDraftPayload) {
      return;
    }

    try {
      localStorage.setItem(draftStorageKey, serializedPayload);
      lastSavedDraftPayload = serializedPayload;
    } catch (error) {
      // No-op when localStorage is unavailable.
    }
  };

  const scheduleDraftSave = (options = {}) => {
    const { immediate = false, force = false } = options;

    if (draftSaveTimer !== null) {
      window.clearTimeout(draftSaveTimer);
      draftSaveTimer = null;
    }

    if (immediate) {
      persistDraft({ force });
      return;
    }

    draftSaveTimer = window.setTimeout(() => {
      draftSaveTimer = null;
      persistDraft({ force });
    }, 120);
  };

  const flushDraftSave = (options = {}) => {
    const { force = false } = options;

    if (draftSaveTimer !== null) {
      window.clearTimeout(draftSaveTimer);
      draftSaveTimer = null;
    }

    persistDraft({ force });
  };

  const restoreDraft = () => {
    try {
      const storedDraft = localStorage.getItem(draftStorageKey);
      if (!storedDraft) {
        return;
      }

      const parsedDraft = JSON.parse(storedDraft);
      if (!parsedDraft || typeof parsedDraft !== "object") {
        return;
      }

      lastSavedDraftPayload = storedDraft;

      if (typeof parsedDraft.values === "object" && parsedDraft.values !== null) {
        persistableFields.forEach((field) => {
          if (!(field.id in parsedDraft.values)) {
            return;
          }

          const storedValue = parsedDraft.values[field.id];
          if (field.type === "checkbox" || field.type === "radio") {
            field.checked = Boolean(storedValue);
            return;
          }

          field.value = typeof storedValue === "string" ? storedValue : "";
        });
      }
    } catch (error) {
      // Ignore malformed data.
    }

    updateConditionalFields();
  };

  const showQuiz = (options = {}) => {
    const { focusFirstField = false } = options;
    quizStarted = true;

    const revealShell = () => {
      if (quizShell) {
        quizShell.hidden = false;
      }

      if (quizShell && shellEnterDuration > 0) {
        quizShell.classList.add("is-entering");
        requestAnimationFrame(() => {
          quizShell.classList.add("is-entering-active");
        });

        window.setTimeout(() => {
          quizShell.classList.remove("is-entering", "is-entering-active");
        }, shellEnterDuration);
      }

      if (focusFirstField) {
        focusFirstFieldInStep();
      }
    };

    if (!introBlock || introTransitionDuration === 0) {
      if (introBlock) {
        introBlock.hidden = true;
      }
      revealShell();
      return;
    }

    setNavigationState({ disabled: true });
    introBlock.classList.add("is-exiting");

    window.setTimeout(() => {
      introBlock.hidden = true;
      introBlock.classList.remove("is-exiting");
      revealShell();
      setNavigationState({ disabled: false });
    }, introTransitionDuration);
  };

  const validateAllStepsBeforeSubmit = () => {
    for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
      const isStepValid = validateStep(quizSteps[stepIndex], {
        focusFirstInvalid: false,
        silent: true
      });

      if (!isStepValid) {
        currentStep = stepIndex;
        updateStepState({ announce: true, focusFirstField: false });
        validateStep(quizSteps[stepIndex], {
          focusFirstInvalid: true,
          silent: false
        });
        scrollToFormTop();
        return false;
      }
    }

    return true;
  };

  initializeAnalyticsFields();
  restoreDraft();
  syncSummaryFields();

  quizForm.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return;
    }

    const isChoiceInput = target instanceof HTMLInputElement && (target.type === "checkbox" || target.type === "radio");

    if (isChoiceInput) {
      return;
    }

    const step = target.closest("[data-quiz-step]");
    if (step) {
      clearQuestionError(step);
      setStepError("");
      target.setAttribute("aria-invalid", "false");
    }

    if (shouldUpdateConditionalFieldsFor(target)) {
      updateConditionalFields();
    }

    scheduleDraftSave();
    syncSummaryFields();
  });

  quizForm.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return;
    }

    const step = target.closest("[data-quiz-step]");

    if (step && target.type === "checkbox" && step.dataset.questionType === "multi-limit") {
      const maxSelect = Number(step.dataset.maxSelect || 2);
      const checked = Array.from(step.querySelectorAll("input[type='checkbox']:checked"));
      if (checked.length > maxSelect) {
        target.checked = false;
        const maxMessage = step.dataset.maxMessage || `Puedes seleccionar hasta ${maxSelect} opciones.`;
        setStepError(maxMessage);
        setQuestionError(step, maxMessage);
      } else {
        clearQuestionError(step);
        setStepError("");
      }
    } else if (step) {
      clearQuestionError(step);
      setStepError("");
    }

    if (shouldUpdateConditionalFieldsFor(target)) {
      updateConditionalFields();
    }

    scheduleDraftSave();
    syncSummaryFields();
  });

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (isTransitioning) {
        return;
      }

      const activeStep = quizSteps[currentStep];
      const isStepValid = validateStep(activeStep, {
        focusFirstInvalid: true,
        silent: false
      });

      if (!isStepValid) {
        return;
      }

      moveToStep(currentStep + 1, {
        smoothScroll: false,
        focusFirstField: true
      });
    });
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (isTransitioning || currentStep === 0) {
        return;
      }

      setStepError("");
      moveToStep(currentStep - 1, {
        smoothScroll: false,
        focusFirstField: true
      });
    });
  }

  if (startButton) {
    startButton.addEventListener("click", () => {
      currentStep = 0;
      updateStepState({ announce: false, focusFirstField: false });

      if (!quizStarted) {
        showQuiz({ focusFirstField: true });
      } else {
        focusFirstFieldInStep();
      }
    });
  }

  quizForm.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const targetTag = target.tagName;
    if (targetTag === "TEXTAREA" || targetTag === "SELECT" || targetTag === "BUTTON") {
      return;
    }

    if (currentStep >= stepCount - 1) {
      return;
    }

    event.preventDefault();
    if (nextButton) {
      nextButton.click();
    }
  });

  quizForm.addEventListener("submit", (event) => {
    if (isTransitioning) {
      event.preventDefault();
      return;
    }

    if (currentStep !== stepCount - 1) {
      event.preventDefault();
      return;
    }

    const currentStepValid = validateStep(quizSteps[currentStep], {
      focusFirstInvalid: true,
      silent: false
    });

    if (!currentStepValid) {
      event.preventDefault();
      return;
    }

    const allStepsValid = validateAllStepsBeforeSubmit();
    if (!allStepsValid) {
      event.preventDefault();
      return;
    }

    isSubmitting = true;
    syncSummaryFields();
    if (submittedAtField) {
      submittedAtField.value = new Date().toISOString();
    }
    flushDraftSave({ force: true });

    try {
      localStorage.setItem(lastSubmissionKey, "quiz");
      localStorage.removeItem(draftStorageKey);
      lastSavedDraftPayload = "";
    } catch (error) {
      // No-op.
    }
  });

  window.addEventListener("beforeunload", () => {
    if (isSubmitting) {
      return;
    }

    flushDraftSave();
  });

  updateStepState({
    announce: false,
    focusFirstField: false
  });

  if (quizShell) {
    quizShell.hidden = !quizStarted;
  }

  if (quizStarted && introBlock) {
    introBlock.hidden = true;
  }
});
