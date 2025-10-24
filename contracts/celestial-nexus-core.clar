;; ============================================================
;; CELESTIAL NEXUS CORE CONTRACT
;; ============================================================
;; Decentralized platform for cataloging and validating
;; astronomical observations with distributed verification
;; and gamified achievement recognition system
;; ============================================================

;; Error codes and constants
(define-constant fail-actor-not-found u100)
(define-constant fail-actor-already-exists u101)
(define-constant fail-invalid-record u102)
(define-constant fail-unauthorized-access u103)
(define-constant fail-duplicate-validation u104)
(define-constant fail-self-validation u105)
(define-constant fail-honor-present u106)
(define-constant fail-criteria-unmet u107)
(define-constant fail-bad-parameters u108)

;; Data structures for observation cataloging
;; Registry of active observers
(define-map observer-profiles
  { principal-id: principal }
  {
    handle: (string-utf8 50),
    joined-at: uint,
    total-submissions: uint,
    total-confirmations: uint,
  }
)

;; Observation records stored with full metadata
(define-map observation-records
  { record-key: uint }
  {
    submitted-by: principal,
    target-name: (string-utf8 100),
    category: (string-utf8 50),
    coords: {
      ra: (string-utf8 20),
      dec: (string-utf8 20),
    },
    block-num: uint,
    metadata: {
      site: (string-utf8 100),
      clarity: (string-utf8 50),
      conditions: (string-utf8 100),
    },
    instrument: (string-utf8 200),
    description: (string-utf8 500),
    hash-proof: (optional (buff 32)),
    confirmation-tally: uint,
  }
)

;; Validation tracking - prevents duplicate verifications
(define-map validation-ledger
  {
    obs-id: uint,
    validator: principal,
  }
  { is-valid: bool }
)

;; Achievement and recognition system
(define-map recognition-types
  { honor-id: uint }
  {
    title: (string-utf8 50),
    summary: (string-utf8 200),
    requirements: (string-utf8 200),
    tier: (string-utf8 20),
  }
)

;; Individual achievement awards
(define-map observer-honors
  {
    observer: principal,
    honor-id: uint,
  }
  {
    attained-block: uint,
    associated-record: (optional uint),
  }
)

;; Category distribution tracking per observer
(define-map observer-categories
  {
    observer: principal,
    category: (string-utf8 50),
  }
  { qty: uint }
)

;; Global state variables
(define-data-var next-record-id uint u1)
(define-data-var next-honor-id uint u1)

;; ============================================================
;; PRIVATE HELPER FUNCTIONS
;; ============================================================

;; Retrieve current submission count
(define-private (fetch-submission-count (who principal))
  (default-to u0
    (get total-submissions (map-get? observer-profiles { principal-id: who }))
  )
)

;; Retrieve current confirmation tally
(define-private (fetch-confirmation-count (who principal))
  (default-to u0
    (get total-confirmations (map-get? observer-profiles { principal-id: who }))
  )
)

;; Update category statistics for observer
(define-private (increment-category-stat
    (who principal)
    (cat (string-utf8 50))
  )
  (let ((existing (map-get? observer-categories {
      observer: who,
      category: cat,
    })))
    (match existing
      entry-data (map-set observer-categories {
        observer: who,
        category: cat,
      } { qty: (+ (get qty entry-data) u1) }
      )
      (map-set observer-categories {
        observer: who,
        category: cat,
      } { qty: u1 }
      )
    )
  )
)

;; Check if observer possesses a specific honor
(define-private (check-honor-awarded
    (observer principal)
    (honor-id uint)
  )
  (is-some (map-get? observer-honors {
    observer: observer,
    honor-id: honor-id,
  }))
)

;; Grant an honor to an observer
(define-private (confer-honor
    (observer principal)
    (honor-id uint)
    (obs-ref (optional uint))
  )
  (if (check-honor-awarded observer honor-id)
    false
    (map-set observer-honors {
      observer: observer,
      honor-id: honor-id,
    } {
      attained-block: block-height,
      associated-record: obs-ref,
    })
  )
)

;; Evaluate progress for initial honor award
(define-private (assess-starter-honor (who principal))
  (let ((sub-count (fetch-submission-count who)))
    (if (>= sub-count u5)
      (confer-honor who u1 none)
      false
    )
  )
)

;; Placeholder for multi-category achievement
(define-private (assess-diversity-honor (who principal))
  false
)

;; Execute all achievement checks after action
(define-private (process-achievement-checks (who principal))
  (begin
    (assess-starter-honor who)
    (assess-diversity-honor who)
    true
  )
)

;; ============================================================
;; READ-ONLY QUERY FUNCTIONS
;; ============================================================

;; Query observer information
(define-read-only (fetch-observer-data (principal-addr principal))
  (map-get? observer-profiles { principal-id: principal-addr })
)

;; Query observation details
(define-read-only (fetch-record-data (rec-id uint))
  (map-get? observation-records { record-key: rec-id })
)

;; Determine if validation exists
(define-read-only (has-validated
    (record-id uint)
    (validator principal)
  )
  (default-to false
    (get is-valid
      (map-get? validation-ledger {
        obs-id: record-id,
        validator: validator,
      })
    ))
)

;; Query achievement details
(define-read-only (fetch-honor-data (hid uint))
  (map-get? recognition-types { honor-id: hid })
)

;; Query earned achievements
(define-read-only (fetch-observer-honor
    (observer principal)
    (honor-id uint)
  )
  (map-get? observer-honors {
    observer: observer,
    honor-id: honor-id,
  })
)

;; Query category observation statistics
(define-read-only (fetch-category-stats
    (observer principal)
    (category (string-utf8 50))
  )
  (default-to { qty: u0 }
    (map-get? observer-categories {
      observer: observer,
      category: category,
    })
  )
)

;; ============================================================
;; PUBLIC TRANSACTION FUNCTIONS
;; ============================================================

;; Register new observer in the system
(define-public (establish-observer-account (display-handle (string-utf8 50)))
  (let ((caller tx-sender))
    (asserts! (> (len display-handle) u0) (err fail-bad-parameters))
    (map-set observer-profiles { principal-id: caller } {
      handle: display-handle,
      joined-at: block-height,
      total-submissions: u0,
      total-confirmations: u0,
    })
    ;; Automatically grant founding membership honor
    (confer-honor caller u0 none)
    (ok true)
  )
)

;; Submit new observation for platform
(define-public (submit-celestial-observation
    (target-designation (string-utf8 100))
    (observation-type (string-utf8 50))
    (ra-coordinate (string-utf8 20))
    (dec-coordinate (string-utf8 20))
    (observation-site (string-utf8 100))
    (transparency-level (string-utf8 50))
    (atmospheric-conditions (string-utf8 100))
    (device-used (string-utf8 200))
    (observer-notes (string-utf8 500))
    (verification-hash (optional (buff 32)))
  )
  (let (
      (caller tx-sender)
      (next-id (var-get next-record-id))
    )
    ;; Validate essential fields
    (asserts! (and (> (len target-designation) u0) (> (len observation-type) u0))
      (err fail-bad-parameters)
    )
    ;; Store observation record
    (map-set observation-records { record-key: next-id } {
      submitted-by: caller,
      target-name: target-designation,
      category: observation-type,
      coords: {
        ra: ra-coordinate,
        dec: dec-coordinate,
      },
      block-num: block-height,
      metadata: {
        site: observation-site,
        clarity: transparency-level,
        conditions: atmospheric-conditions,
      },
      instrument: device-used,
      description: observer-notes,
      hash-proof: verification-hash,
      confirmation-tally: u0,
    })
    ;; Update category tracking
    (increment-category-stat caller observation-type)
    ;; Trigger achievement evaluation
    (process-achievement-checks caller)
    ;; Advance counter
    (var-set next-record-id (+ next-id u1))
    (ok next-id)
  )
)

;; Register validation of existing observation
(define-public (validate-celestial-record (record-id uint))
  (let (
      (caller tx-sender)
      (stored-observation (map-get? observation-records { record-key: record-id }))
    )
    ;; Verify observation exists
    (asserts! (is-some stored-observation) (err fail-invalid-record))
    ;; Unwrap for processing
    (let ((obs-data (unwrap! stored-observation (err fail-invalid-record))))
      ;; Reject self-validation
      (asserts! (not (is-eq caller (get submitted-by obs-data)))
        (err fail-self-validation)
      )
      ;; Prevent duplicate validation
      (asserts! (not (has-validated record-id caller))
        (err fail-duplicate-validation)
      )
      ;; Record validation
      (map-set validation-ledger {
        obs-id: record-id,
        validator: caller,
      } { is-valid: true }
      )
      ;; Update observation confirmation count
      (map-set observation-records { record-key: record-id }
        (merge obs-data { confirmation-tally: (+ (get confirmation-tally obs-data) u1) })
      )
      ;; Special honor at milestone verification threshold
      (if (is-eq (+ (get confirmation-tally obs-data) u1) u10)
        (confer-honor (get submitted-by obs-data) u4
          (some record-id)
        )
        false
      )
      ;; Honor for frequent validators
      (if (is-eq (+ (fetch-confirmation-count caller) u1) u10)
        (confer-honor caller u5 none)
        false
      )
      (ok true)
    )
  )
)

;; Create new honor type (admin function)
(define-public (establish-honor-type
    (honor-title (string-utf8 50))
    (honor-summary (string-utf8 200))
    (achievement-requirements (string-utf8 200))
    (honor-tier (string-utf8 20))
  )
  (let (
      (caller tx-sender)
      (next-id (var-get next-honor-id))
    )
    ;; Admin authorization check
    (asserts! (is-eq caller tx-sender) (err fail-unauthorized-access))
    ;; Register honor type
    (map-set recognition-types { honor-id: next-id } {
      title: honor-title,
      summary: honor-summary,
      requirements: achievement-requirements,
      tier: honor-tier,
    })
    ;; Increment honor counter
    (var-set next-honor-id (+ next-id u1))
    (ok next-id)
  )
)