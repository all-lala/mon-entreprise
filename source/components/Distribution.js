/* @flow */

import Observer from '@researchgate/react-intersection-observer'
import withColours from 'Components/utils/withColours'
import React, { Component } from 'react'
import emoji from 'react-easy-emoji'
import { Trans } from 'react-i18next'
import { connect } from 'react-redux'
import { config, Spring } from 'react-spring'
import { compose } from 'redux'
import répartitionSelector from 'Selectors/repartitionSelectors'
import { flatRulesSelector } from 'Selectors/analyseSelectors'
import Value from 'Components/Value'
import { isIE } from '../utils'
import './Distribution.css'
import './PaySlip'
import RuleLink from './RuleLink'
import type { ThemeColours } from 'Components/utils/withColours'
import type { Répartition } from 'Types/ResultViewTypes.js'
import { findRuleByDottedName } from 'Engine/rules'

type Props = ?Répartition & {
	colours: ThemeColours
}
type State = {
	branchesInViewport: Array<string>
}

const ANIMATION_SPRING = config.gentle
class Distribution extends Component<Props, State> {
	elementRef = null
	state = {
		branchesInViewport: []
	}
	handleBrancheInViewport = branche => (event, unobserve) => {
		if (!event.isIntersecting) {
			return
		}
		unobserve()
		this.setState(({ branchesInViewport }) => ({
			branchesInViewport: [branche, ...branchesInViewport]
		}))
	}

	render() {
		const {
			colours: { colour },
			rules,
			// $FlowFixMe
			...distribution
		} = this.props
		if (!Object.values(distribution).length) {
			return null
		}
		const {
			répartition,
			cotisationMaximum,
			total,
			salaireChargé,
			salaireNet
		} = distribution
		return (
			<>
				<div className="distribution-chart__container">
					{répartition.map(
						([brancheDottedName, { partPatronale, partSalariale }]) => {
							const branche = findRuleByDottedName(rules, brancheDottedName),
								brancheInViewport =
									this.state.branchesInViewport.indexOf(brancheDottedName) !==
									-1
							const montant = brancheInViewport
								? partPatronale + partSalariale
								: 0

							return (
								<Observer
									key={brancheDottedName}
									threshold={[0.5]}
									onChange={this.handleBrancheInViewport(brancheDottedName)}>
									<Spring
										config={ANIMATION_SPRING}
										to={{
											flex: montant / cotisationMaximum,
											opacity: montant ? 1 : 0
										}}>
										{styles => (
											<div
												className="distribution-chart__item"
												style={{
													opacity: styles.opacity
												}}>
												<BranchIcône icône={branche.icons} />
												<div className="distribution-chart__item-content">
													<p className="distribution-chart__counterparts">
														<span className="distribution-chart__branche-name">
															<RuleLink {...branche} />
														</span>
														<br />
														<small>{branche.summary}</small>
													</p>
													<ChartItemBar
														{...{ styles, colour, montant, total }}
													/>
												</div>
											</div>
										)}
									</Spring>
								</Observer>
							)
						}
					)}
				</div>
				<div className="distribution-chart__total">
					<span />
					<RuleLink {...salaireNet} />
					<Value {...salaireNet} numFractionDigits={0} />
					<span>+</span>
					<Trans>Cotisations</Trans>
					<Value numFractionDigits={0} unit="€">
						{total.partPatronale + total.partSalariale}
					</Value>
					<span />
					<div className="distribution-chart__total-border" />
					<span>=</span>
					<RuleLink {...salaireChargé} />
					<Value {...salaireChargé} numFractionDigits={0} />
				</div>
			</>
		)
	}
}
export default compose(
	withColours,
	connect(state => ({
		...répartitionSelector(state),
		rules: flatRulesSelector(state)
	}))
)(Distribution)

let ChartItemBar = ({ styles, colour, montant, total }) => (
	<div className="distribution-chart__bar-container">
		<div
			className="distribution-chart__bar"
			style={{
				backgroundColor: colour,
				...(!isIE()
					? { flex: styles.flex }
					: { minWidth: styles.flex * 500 + 'px' })
			}}
		/>
		<div
			css={`
				font-weight: bold;
				margin-left: 1em;
				color: var(--textColourOnWhite);
			`}>
			<Value numFractionDigits={0} unit="€">
				{montant}
			</Value>
		</div>
	</div>
)

let BranchIcône = ({ icône }) => (
	<div className="distribution-chart__legend">
		<span className="distribution-chart__icon">{emoji(icône)}</span>
	</div>
)
