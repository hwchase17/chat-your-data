import * as React from 'react';
import { connect } from 'react-redux';
import { navigateAddModal, navigateRemoveModal, setNavigation } from '../actions/navigation';
import { Container } from '../Global/Container';
import { NavigationInterface } from '../Interfaces/NavigationInterface';
import { StateInterface } from '../Interfaces/StateInterface';
import { SettingsInterface } from '../Interfaces/Settings/SettingsInterface';
import { hasModuleAvailable, moduleNames } from '../reducers/settings';
import { Config } from '../config';
import { Notifications } from './notifications/Notifications';
import { PremiumModalOrigin } from 'client/Global/AnalyticsEvents';
import { QuotaTypes, SubscriptionInterface } from 'client/Interfaces/Subscription';
import { doesCurrentPlanSupportFeature } from 'client/reducers/Subscription/companySubscription';
import { isFinancingTemporaryDisabled } from 'client/components/FinancingRouter/ageras/helpers';
import { TokenInterface } from 'client/Interfaces/TokenInterface';
import { l } from 'client/Other/Translation';

import BurgerMenuIcon from 'static/images/nav-burger-white.svg'
import './Menu.scss';

class MenuClass extends Container {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      showWarning: false,
      navigationItem: null,
      burgerOpen: false
    };
  }

  componentDidMount() {
    let menuItems = this.getMainMenuItems();
    this.setState({ items: menuItems });
    document.body.addEventListener('click', this.closeBurger.bind(this));
  }

  componentWillUnmount() {
    document.body.removeEventListener('click', this.closeBurger.bind(this), false);
  }

  navigate(item) {
    if (item.action) {
      return item.action();
    }
    const navigation = {
      support: () => {
        this.props.actions.openSupportModal();
      },
      logout: () => {
        this.props.actions.setNavigation({ ...this.props.navigation, path: '/logout' });
      },
      upgrade: () => {
        this.props.actions.openSubscriptionModal();
      },
      settings: () => {
        this.props.actions.setNavigation({
          ...this.props.navigation,
          path: '/myAccount'
        });
      }
    };
    if (navigation[item.name]) {
      return navigation[item.name]();
    }
    this.props.actions.setNavigation({ ...this.props.navigation, path: '/' + item.name });
  }

  closeBurger() {
    this.setState({ burgerOpen: false });
  }

  getMainMenuItems = () => {
    let items = [];

    const isTouchEnabled = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isTouchEnabled = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
      return isTouchEnabled && (!!userAgent.match(/(iphone|ipod|ipad)/) || !!userAgent.match(/(android)/))
    }

    items.push({
      name: 'logout',
      label: 'Logout',
      className: isTouchEnabled() ? '' : 'right',
    });

    this.props.settings.modules.forEach(module => {
      if(module.menu && module.hidden === false) {
        const item = {
          name: module.name,
          label: module.label
        };

        switch(module.name) {
          case 'invoices':
            item.className = 'main-menu-invoices';
            break;
          case 'settings':
            item.className = isTouchEnabled() ? '' : 'right';
            break;
          case 'support':
            item.target = '_blank';
            item.className = isTouchEnabled() ? '' : 'right';
            break;
          case 'upgrade':
            item.className = 'right';
            break;
        }
        items.push(item);
      }
    });

    if (!doesCurrentPlanSupportFeature(this.props.subscription, QuotaTypes.EXPENSES)) {
      items = items.filter(s => s.name !== 'expenses');
    }
    if (isFinancingTemporaryDisabled(this.props.token)) {
      items = items.filter(s => s.name !== 'invoiceFinancing');
    }

    const workspace = Config.getVarsFromWebpackDefinePlugin().workspace;
    if (workspace === 'local' || workspace === 'test') {
      items.push({
        name: 'gallery',
        label: 'Gallery',
        className: 'right',
      });
    }

    return items;
  }

  addMenuItems(items, current, menuName) {
    const invoiceSubTabs = ['reactInvoiceList', 'reactRecurringProfiles', 'receipts', 'deliverynotes'];
    return items.map((item) => {
      const {className, name, target, href, label} = item;
      const classes = ['link'];

      const id = `${name}-tab`;
      if (className) {
        classes.push(className);
      }
      if (name === current ||
        (invoiceSubTabs.includes(current) && invoiceSubTabs.includes(name))) {
        classes.push('active');
      }

      return (
        <a
          data-automation={`${menuName}-${item.name}`}
          href={href || ''}
          target={target || ''}
          key={name}
          className={classes.join(' ')}
          id={id}
          onClick={(event) => {
            this.setState({ burgerOpen: false });
            if (!href) {
              this.navigate(item);
              event.preventDefault();
            }
          }}
        >
          {l(`mainmenu.${label}`)}
        </a>
      );
    });
  }

  render() {
    const current = this.props.navigation.path.split('/')[1];
    const leftMenu = this.state.items.filter((item) => !item.className || item.className.indexOf('right') < 0);
    const rightMenu = this.state.items.filter((item) => item.className && item.className.indexOf('right') >= 0);
    return (
      <div className="header-toolbar">
        <div id="logo" />
        <div className="Menu horizontal" data-automation="menu-mainmenu">
          <div className="burger">
            <a
              className="link"
              onClick={() => this.setState({ burgerOpen: !this.state.burgerOpen })}>
              <img src={BurgerMenuIcon} />
            </a>
            <div className={'burgerMenu' + (this.state.burgerOpen ? '' : ' hidden')}>
              {this.addMenuItems(leftMenu, current, 'burgermenu')}
            </div>
          </div>
          <div className="left">
            {this.addMenuItems(leftMenu, current, 'mainmenu')}
          </div>
          <div className="right">
            {this.addMenuItems(rightMenu, current, 'mainmenu')}
            {this.props.showNotificationsIcon && <Notifications />}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  navigation: state.navigation,
  brand: state.token.prn.provider,
  showNotificationsIcon: state.settings && hasModuleAvailable(state.settings, moduleNames.reactDashboard),
  subscription: state.subscriptionManagement.companySubscription.subscription,
  token: state.token,
  settings: state.settings
});

const mapDispatchToProps = (dispatch) => ({
  actions: {
    setNavigation: (navigation) => dispatch(setNavigation(navigation)),
    openSubscriptionModal: () => {
      dispatch(
        navigateAddModal({
          component: 'PremiumPlanModal',
          props: {
            origin: PremiumModalOrigin.MainMenu,
            isOpen: true
          }
        })
      );
    },
    openSupportModal: () => {
      dispatch(
        navigateAddModal({
          component: 'SupportModal',
          props: {
            isOpen: true,
            close: () => dispatch(navigateRemoveModal('SupportModal'))
          }
        })
      );
    }
  }
});

export const Menu = connect(
  mapStateToProps,
  mapDispatchToProps
)(MenuClass);
