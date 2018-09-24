import React from 'react'
import axios from 'axios'
import { connect } from 'react-redux'
import Loading from '../common/Loading'
import DataTable from './DataTable'

class MarketPairs extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoaded: this.props.market_pairs && this.props.active_market.filtered_pairs
        };
    }

    _getTickerBySymbol(data) {
        let ticker = {}
        data.forEach(item => {
            let symbol = item.symbol || item.s;
            ticker[symbol] = {
                symbol: symbol,
                lastPrice: item.lastPrice || item.c,
                priceChange: item.priceChange || item.p,
                priceChangePercent: item.priceChangePercent || item.P,
                highPrice: item.highPrice || item.h,
                lowPrice: item.lowPrice || item.l,
                quoteVolume: item.quoteVolume || item.q,
            }
        }) 
        return ticker;
    }

    _handleTabClick(market) {
        this.props.dispatch({
            type: 'SET_ACTIVE_MARKET',
            data: {
                filtered_pairs: Object.keys(this.props.market_pairs).filter(item => item.endsWith(market)),
                market: market
            }
        })
    }

    _connectSocketStreams(streams) {
        streams = streams.join('/');
        let connection = btoa(streams);
        this[connection] = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
        this[connection].onmessage = evt => { 
            let ticker = this._getTickerBySymbol(JSON.parse(evt.data).data)
            this.props.dispatch({
                type: 'UPDATE_MARKET_PAIRS',
                data: ticker
            })
            this.setState({
                isLoaded: true
            })
        }
        this[connection].onerror = evt => {
            console.error(evt);
        }
    }

    _disconnectSocketStreams(streams){
        streams = streams.join('/');
        let connection = btoa(streams);
        if (this[connection].readyState === WebSocket.OPEN) {
            this[connection].close();
        }
    }

    componentDidMount() {

        if(!this.state.isLoaded){
            axios({
                method: 'get',
                url: 'https://cors-anywhere.herokuapp.com/https://api.binance.com/api/v1/ticker/24hr'
            })
            .then(response => {
                let ticker = this._getTickerBySymbol(response.data)
                this.props.dispatch({
                    type: 'ADD_MARKET_PAIRS',
                    data: ticker
                })
                this._handleTabClick('BTC')
                this.setState({
                    isLoaded: true
                })
            })
            .catch(error => {
                this.setState({
                    isLoaded: false,
                    error: error
                })
            });
        }

        this._connectSocketStreams(['!ticker@arr'])

    }

    componentWillUnmount() {
        this._disconnectSocketStreams(['!ticker@arr'])
    }

    render() {
        const { error, isLoaded } = this.state;
        if (error) {
          return <div className="alert alert-danger">{error.message}</div>;
        }
        if (!isLoaded) {
          return <Loading />;
        }
        return (
            <React.Fragment>
                <ul className="nav nav-tabs pt-2">
                    <li className="nav-item">
                        <a className={this.props.active_market.market === 'BNB' ? 'nav-link active' : 'nav-link'} onClick={this._handleTabClick.bind(this, 'BNB')}>BNB<span className="d-none d-sm-inline"> Markets</span></a>
                    </li>
                    <li className="nav-item">
                        <a className={this.props.active_market.market === 'BTC' ? 'nav-link active' : 'nav-link'} onClick={this._handleTabClick.bind(this, 'BTC')}>BTC<span className="d-none d-sm-inline"> Markets</span></a>
                    </li>
                    <li className="nav-item">
                        <a className={this.props.active_market.market === 'ETH' ? 'nav-link active' : 'nav-link'} onClick={this._handleTabClick.bind(this, 'ETH')}>ETH<span className="d-none d-sm-inline"> Markets</span></a>
                    </li>
                    <li className="nav-item">
                        <a className={this.props.active_market.market === 'USDT' ? 'nav-link active' : 'nav-link'} onClick={this._handleTabClick.bind(this, 'USDT')}>USDT<span className="d-none d-sm-inline"> Markets</span></a>
                    </li>    
                </ul>
                {this.props.market_pairs && this.props.active_market.filtered_pairs ? <DataTable ticker={this.props.market_pairs} filter={this.props.active_market.filtered_pairs} /> : <Loading />}
            </React.Fragment>    
      )
    }

}

export default connect(
    state => state
)(MarketPairs)