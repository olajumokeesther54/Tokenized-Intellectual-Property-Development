;; Inventor Verification Contract
;; This contract validates legitimate creators and maintains their credentials

(define-data-var admin principal tx-sender)

;; Data map to store verified inventors
(define-map inventors
  { inventor-id: principal }
  {
    name: (string-utf8 100),
    credentials: (string-utf8 500),
    verification-date: uint,
    is-verified: bool
  }
)

;; Public function to register as an inventor (self-registration)
(define-public (register-inventor (name (string-utf8 100)) (credentials (string-utf8 500)))
  (let ((caller tx-sender))
    (if (is-inventor caller)
        (err u1) ;; Already registered
        (ok (map-set inventors
                     { inventor-id: caller }
                     {
                       name: name,
                       credentials: credentials,
                       verification-date: block-height,
                       is-verified: false
                     }))
    )
  )
)

;; Admin function to verify an inventor
(define-public (verify-inventor (inventor-id principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (asserts! (is-some (map-get? inventors { inventor-id: inventor-id })) (err u404))
    (ok (map-set inventors
                 { inventor-id: inventor-id }
                 (merge (unwrap-panic (map-get? inventors { inventor-id: inventor-id }))
                        { is-verified: true })
    ))
  )
)

;; Read-only function to check if an address is a registered inventor
(define-read-only (is-inventor (address principal))
  (is-some (map-get? inventors { inventor-id: address }))
)

;; Read-only function to check if an address is a verified inventor
(define-read-only (is-verified-inventor (address principal))
  (match (map-get? inventors { inventor-id: address })
    inventor (get is-verified inventor)
    false
  )
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (ok (var-set admin new-admin))
  )
)
