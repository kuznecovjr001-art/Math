---
name: math-progress-contract
description: "Контракт корректности учебных метрик. Используй при задачах Math, связанных с этой областью."
---
# math-progress-contract

1. Определить event schema: attemptId, sessionId, profileId, missionId, card instance, outcome, helpLevel, mode, date, schemaVersion.
2. Не допускать двойного учёта клика, повторного submit и промежуточного шага внутри многошаговой задачи.
3. Развести viewed/tried/completed и mastered/confirmed. Несделанная миссия не равна непонятому навыку.
4. Графики самостоятельных попыток считать с чётким числителем/знаменателем, исключая обучение и подсказки. Показывать малую выборку, не выдумывать проценты при отсутствии данных.
5. Внутри dashboard документация расчётов и тесты с симуляцией дат.
