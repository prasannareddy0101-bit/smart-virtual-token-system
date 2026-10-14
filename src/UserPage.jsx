import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import LogoutButton from './LogoutButton';

function UserPage() {
  const [service, setService] = useState('')
  const [token, setToken] = useState(null)
  const [queueInfo, setQueueInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // =========================
  // GET TOKEN
  // =========================
  const getToken = async () => {
    if (!service) {
      setMessage('Please select a service')
      return
    }

    try {
      setLoading(true)
      setMessage('')

      const response = await fetch(
        'http://localhost:5000/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            service: service
          })
        }
      )

      if (!response.ok) {
        throw new Error('Could not create token')
      }

      const data = await response.json()

      setToken(data.token)

    } catch (error) {
      console.error(error)

      setMessage(
        'Could not connect to the server'
      )

    } finally {
      setLoading(false)
    }
  }

  // =========================
  // GET QUEUE INFORMATION
  // =========================
  const getQueueInfo = async () => {
    if (!token) return

    try {
      const response = await fetch(
        `http://localhost:5000/queue/info/${token}`
      )

      if (!response.ok) {
        throw new Error(
          'Could not get queue information'
        )
      }

      const data = await response.json()

      setQueueInfo(data)

    } catch (error) {
      console.error(
        'Queue information error:',
        error
      )
    }
  }

  // =========================
  // LOAD QUEUE INFO
  // =========================
  useEffect(() => {
    if (!token) return

    getQueueInfo()
  }, [token])

  // =========================
  // SOCKET.IO REAL-TIME UPDATE
  // =========================
  useEffect(() => {
    const socket = io('http://localhost:5000')

    socket.on('connect', () => {
      console.log(
        'User connected:',
        socket.id
      )
    })

    socket.on('queueUpdated', () => {
      console.log('Queue updated!')

      if (token) {
        getQueueInfo()
      }
    })

    socket.on('disconnect', () => {
      console.log('User disconnected')
    })

    return () => {
      socket.disconnect()
    }
  }, [token])

  // =========================
  // STATUS TEXT
  // =========================
  const getStatusText = () => {
    if (!queueInfo) {
      return 'Waiting'
    }

    if (queueInfo.status === 'Waiting') {
      return 'Waiting'
    }

    if (queueInfo.status === 'Called') {
      return 'Called'
    }

    if (queueInfo.status === 'Completed') {
      return 'Completed'
    }

    return queueInfo.status
  }

  // =========================
  // STATUS MESSAGE
  // =========================
  const getStatusMessage = () => {
    if (!queueInfo) {
      return 'Your token has been added to the queue.'
    }

    if (queueInfo.status === 'Waiting') {
      return 'Please wait for your turn.'
    }

    if (queueInfo.status === 'Called') {
      return queueInfo.counterNumber
        ? `Please proceed to Counter ${queueInfo.counterNumber}.`
        : 'Please proceed to the counter.'
    }

    if (queueInfo.status === 'Completed') {
      return 'Your service has been completed.'
    }

    return ''
  }

  // =========================
  // STATUS BACKGROUND
  // =========================
  const getStatusBackground = () => {
    if (!queueInfo) {
      return '#fef3c7'
    }

    if (queueInfo.status === 'Called') {
      return '#dcfce7'
    }

    if (queueInfo.status === 'Completed') {
      return '#e5e7eb'
    }

    return '#fef3c7'
  }

  // =========================
  // STATUS COLOR
  // =========================
  const getStatusColor = () => {
    if (!queueInfo) {
      return '#92400e'
    }

    if (queueInfo.status === 'Called') {
      return '#166534'
    }

    if (queueInfo.status === 'Completed') {
      return '#374151'
    }

    return '#92400e'
  }

  // =========================
  // NOW SERVING
  // =========================
  const renderNowServing = () => {
    if (!queueInfo) {
      return (
        <div style={styles.noServing}>
          —
        </div>
      )
    }

    const serving = Array.isArray(queueInfo.nowServing)
      ? queueInfo.nowServing
      : []

    if (serving.length === 0) {
      return (
        <div style={styles.noServing}>
          No one is currently being served
        </div>
      )
    }

    return (
      <div style={styles.counterGrid}>

        {serving.map((item) => (
          <div
            key={item.counterNumber}
            style={styles.counterCard}
          >

            <div style={styles.counterNumber}>
              COUNTER {item.counterNumber}
            </div>

            <div style={styles.servingToken}>
              {item.token}
            </div>

            <div style={styles.servingStatus}>
              ● Serving
            </div>

          </div>
        ))}

      </div>
    )
  }

  return (
    <div style={styles.page}>

      {/* =========================
    HEADER
========================= */}

<div
  style={{
    ...styles.header,
    position: 'relative',
    paddingTop: '10px',
  }}
>
  <div
    style={{
      position: 'absolute',
      top: 0,
      right: 0,
    }}
  >
    <LogoutButton role="user" />
  </div>

  <h1 style={styles.title}>
    Smart Virtual Token
  </h1>

  <p style={styles.subtitle}>
    Queue Management System
  </p>
</div>


      {/* =========================
          GET TOKEN PAGE
      ========================= */}

      {!token ? (

        <div style={styles.card}>

          <div style={styles.icon}>
            🎫
          </div>

          <h2 style={styles.heading}>
            Get Your Token
          </h2>

          <p style={styles.description}>
            Select the service you need and
            join the queue.
          </p>


          {/* SERVICE LABEL */}

          <label style={styles.label}>
            Select Service
          </label>


          {/* SERVICE DROPDOWN */}

          <select
            value={service}
            onChange={(e) =>
              setService(e.target.value)
            }
            style={styles.select}
          >

            <option
              value=""
              style={styles.option}
            >
              Select a service
            </option>

            <option
              value="Income Certificate"
              style={styles.option}
            >
              Income Certificate
            </option>

            <option
              value="Birth Certificate"
              style={styles.option}
            >
              Birth Certificate
            </option>

            <option
              value="Caste Certificate"
              style={styles.option}
            >
              Caste Certificate
            </option>

            <option
              value="Other Services"
              style={styles.option}
            >
              Other Services
            </option>

          </select>


          {/* GET TOKEN BUTTON */}

          <button
            onClick={getToken}
            disabled={loading}
            style={{
              ...styles.primaryButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading
                ? 'not-allowed'
                : 'pointer'
            }}
          >

            {loading
              ? 'Generating...'
              : 'GET TOKEN'}

          </button>


          {/* ERROR MESSAGE */}

          {message && (
            <div style={styles.errorMessage}>
              {message}
            </div>
          )}

        </div>

      ) : (

        <div>

          {/* =========================
              TOKEN CARD
          ========================= */}

          <div style={styles.tokenCard}>

            <p style={styles.smallTitle}>
              YOUR TOKEN
            </p>

            <div style={styles.bigToken}>
              {token}
            </div>

            <p style={styles.serviceText}>
              {queueInfo
                ? queueInfo.service
                : service}
            </p>


            {/* STATUS BADGE */}

            <div
              style={{
                ...styles.statusBadge,
                background:
                  getStatusBackground(),
                color:
                  getStatusColor()
              }}
            >
              ● {getStatusText()}
            </div>

          </div>


          {/* =========================
              NOW SERVING
          ========================= */}

          <div style={styles.nowServingSection}>

            <p style={styles.infoLabel}>
              NOW SERVING
            </p>

            {renderNowServing()}

          </div>


          {/* =========================
              QUEUE INFORMATION
          ========================= */}

          <div style={styles.infoGrid}>

            {/* PEOPLE AHEAD */}

            <div style={styles.infoCard}>

              <p style={styles.infoLabel}>
                PEOPLE AHEAD
              </p>

              <h2 style={styles.infoValue}>
                {queueInfo
                  ? queueInfo.peopleAhead
                  : '—'}
              </h2>

            </div>


            {/* ESTIMATED WAIT */}

            <div style={styles.infoCard}>

              <p style={styles.infoLabel}>
                ESTIMATED WAIT
              </p>

              <h2 style={styles.infoValue}>
                {queueInfo
                  ? `${queueInfo.peopleAhead * 5} min`
                  : '—'}
              </h2>

            </div>


            {/* YOUR COUNTER */}

            <div style={styles.infoCard}>

              <p style={styles.infoLabel}>
                YOUR COUNTER
              </p>

              <h2 style={styles.infoValue}>

                {queueInfo?.counterNumber
                  ? `Counter ${queueInfo.counterNumber}`
                  : '—'}

              </h2>

            </div>

          </div>


          {/* =========================
              STATUS MESSAGE
          ========================= */}

          <div style={styles.statusMessage}>

            <div style={styles.statusIcon}>
              ●
            </div>

            <div>

              <strong style={styles.statusTitle}>
                {getStatusText()}
              </strong>

              <p style={styles.statusMessageP}>
                {getStatusMessage()}
              </p>

            </div>

          </div>


          {/* LIVE UPDATE */}

          <p style={styles.liveText}>
            ● Live queue updates enabled
          </p>

        </div>

      )}

    </div>
  )
}


/* =====================================================
   STYLES
===================================================== */

const styles = {

  /* PAGE */

  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    padding: '40px 20px',
    fontFamily:
      'Arial, Helvetica, sans-serif',
    color: '#111827'
  },


  /* HEADER */

  header: {
    textAlign: 'center',
    marginBottom: '35px'
  },

  title: {
    margin: 0,
    fontSize: '34px',
    fontWeight: '700',
    color: '#111827'
  },

  subtitle: {
    marginTop: '8px',
    color: '#4b5563',
    fontSize: '16px'
  },


  /* GET TOKEN CARD */

  card: {
    maxWidth: '500px',
    margin: '0 auto',
    background: '#ffffff',
    padding: '35px',
    borderRadius: '18px',
    boxShadow:
      '0 5px 20px rgba(0,0,0,0.07)'
  },

  icon: {
    fontSize: '42px',
    textAlign: 'center',
    marginBottom: '10px'
  },

  heading: {
    textAlign: 'center',
    margin: '5px 0',
    fontSize: '26px',
    color: '#111827',
    fontWeight: '700'
  },

  description: {
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: '30px',
    fontSize: '16px'
  },


  /* LABEL */

  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#111827',
    fontSize: '15px'
  },


  /* DROPDOWN */

  select: {
    width: '100%',
    padding: '14px',
    borderRadius: '9px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    marginBottom: '18px',
    background: '#ffffff',
    color: '#111827',
    cursor: 'pointer',
    outline: 'none'
  },

  option: {
    color: '#111827',
    background: '#ffffff',
    fontSize: '15px'
  },


  /* BUTTON */

  primaryButton: {
    width: '100%',
    padding: '15px',
    border: 'none',
    borderRadius: '9px',
    background: '#2563eb',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700'
  },


  /* ERROR */

  errorMessage: {
    marginTop: '15px',
    padding: '12px',
    borderRadius: '8px',
    background: '#fee2e2',
    color: '#991b1b',
    textAlign: 'center'
  },


  /* TOKEN CARD */

  tokenCard: {
    maxWidth: '600px',
    margin: '0 auto 20px',
    background: '#ffffff',
    padding: '35px',
    borderRadius: '18px',
    textAlign: 'center',
    boxShadow:
      '0 5px 20px rgba(0,0,0,0.07)'
  },

  smallTitle: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: '1px'
  },

  bigToken: {
    fontSize: '64px',
    fontWeight: '800',
    margin: '10px 0',
    color: '#111827'
  },

  serviceText: {
    margin: '5px 0 20px',
    fontSize: '17px',
    color: '#374151',
    fontWeight: '500'
  },


  /* STATUS BADGE */

  statusBadge: {
    display: 'inline-block',
    padding: '8px 18px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '14px'
  },


  /* NOW SERVING */

  nowServingSection: {
    maxWidth: '600px',
    margin: '0 auto 20px',
    background: '#ffffff',
    padding: '22px',
    borderRadius: '16px',
    boxShadow:
      '0 3px 12px rgba(0,0,0,0.05)'
  },

  counterGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginTop: '12px'
  },

  counterCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center'
  },

  counterNumber: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.5px'
  },

  servingToken: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#111827',
    margin: '7px 0'
  },

  servingStatus: {
    fontSize: '12px',
    color: '#16a34a',
    fontWeight: '700'
  },

  noServing: {
    marginTop: '12px',
    color: '#64748b',
    fontSize: '14px',
    textAlign: 'center'
  },


  /* INFO GRID */

  infoGrid: {
    maxWidth: '600px',
    margin: '0 auto 20px',
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, 1fr)',
    gap: '12px'
  },

  infoCard: {
    background: '#ffffff',
    padding: '20px 10px',
    borderRadius: '14px',
    textAlign: 'center',
    boxShadow:
      '0 3px 12px rgba(0,0,0,0.05)'
  },

  infoLabel: {
    margin: 0,
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '700'
  },

  infoValue: {
    margin: '10px 0 0',
    fontSize: '24px',
    color: '#111827'
  },


  /* STATUS MESSAGE */

  statusMessage: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '18px',
    background: '#ffffff',
    borderRadius: '14px',
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start',
    boxShadow:
      '0 3px 12px rgba(0,0,0,0.05)'
  },

  statusIcon: {
    color: '#2563eb',
    fontSize: '18px'
  },

  statusTitle: {
    color: '#111827'
  },

  statusMessageP: {
    margin: '5px 0 0',
    color: '#4b5563'
  },


  /* LIVE TEXT */

  liveText: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#059669',
    fontSize: '13px',
    fontWeight: '500'
  }

}

export default UserPage