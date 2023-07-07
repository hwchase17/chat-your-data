import  React, { useEffect, useState } from 'react';
import './Notifications.scss';

//new
import { getNotificationCount } from 'client/api/notifications';
import { NotificationsModal } from './NotificationsModal'
import { Analytics, checkPlacement } from '../../Global/Analytics';
import { AnalyticsObject, AnalyticsType, Category, Events, Placement, PremiumModalOrigin, Result, deliveryType, trackingFields } from '../../Global/AnalyticsEvents';

export const Notifications = (props) =>  {

  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(undefined)
  const [allCount, setAllCount] = useState(0)
  const [unreadCount, setunreadCount] = useState(0)
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null)

  const updateNotificationCount = async () => {
    const data = await getNotificationCount();
    setAllCount(data?.totalCount)
    setunreadCount(data?.unreadCount)
  }

  useEffect(() => {
    updateNotificationCount();
  },[])

  // Sets a timer to query the server for the notificationsCount every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      updateNotificationCount();
    }, 15000);
    return() => {
      clearInterval(interval)
    }
  },[allCount])

  const getUnreadCount = () => {
    if(unreadCount > 9){
      return "9+"
    }
    return unreadCount
  }

  return(
    <a className={'notifications-button link right'}>
      <div
        className={'button'}
        data-automation="notification-open-modal-button"
        onClick={() => {
          setIsOpen(!isOpen)
          Analytics.trackEvent(Events.viewNotifications,{
            type: AnalyticsType.action,
            category: Category.notification,
            result: Result.success,
            placement: checkPlacement(window.location.pathname)
          })
        }}
      >
        <img src={require("images/notifications/notifications_icon.svg")} />
        <div className={'unread-counter' + (unreadCount === 0 ? ' hidden' : '')}>{getUnreadCount()}</div>
      </div>
      {isOpen && 
        <>
          <NotificationsModal setOpen={setIsOpen}/>
          <div className="notifications-overlay" onClick={() => setIsOpen(false)}></div>
        </>
      }
    </a>
  )
}

export default Notifications
