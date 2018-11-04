# Game AI Playground

Simple turn based RPG AI.

## HOW TO RUN

```
yarn install
yarn ts-node -T src/main.ts
```

## GAME RULE

- Skill has cooldown to next action
- Skill has cost to exec

## SKILL_DATA

| name         | cooldown | damage | defence | charge |
| ------------ | -------- | ------ | ------- | ------ |
| ATTACK       | 5        | 5      | 0       | -2     |
| QUICK_ATTACK | 2        | 2      | 0       | -1     |
| DEFENCE      | 3        | 0      | 4       | +1     |
| DO_NOTHING   | 4        | 0      | 0       | +2     |

## Example

```
loss=553.078 | ε=1 | 0
loss=297.876 | ε=0.7787520933134615 | 500
loss=298.336 | ε=0.606454822840097 | 1000
loss=4.036 | ε=0.4722779627867691 | 1500
loss=149.319 | ε=0.3677874521460121 | 2000
loss=5.501 | ε=0.28641524825313086 | 2500
loss=148.299 | ε=0.22304647413401948 | 3000
loss=1.995 | ε=0.17369790863805412 | 3500
loss=147.651 | ε=0.13526760995605422 | 4000
loss=3.715 | ε=0.10533993441078586 | 4500
loss=149.803 | ε=0.0820336944319021 | 5000
loss=148.791 | ε=0.06388391126108031 | 5500
loss=1.407 | ε=0.04999916370086185 | 6000
loss=1.095 | ε=0.04999916370086185 | 6500
loss=445.167 | ε=0.04999916370086185 | 7000
loss=6.563 | ε=0.04999916370086185 | 7500
loss=1.094 | ε=0.04999916370086185 | 8000
loss=2.346 | ε=0.04999916370086185 | 8500
loss=0.638 | ε=0.04999916370086185 | 9000
loss=1.454 | ε=0.04999916370086185 | 9500
---- trained
1: 30/0 > deffence
2: 30/0 > deffence
1: 30/1 > do-nothing
2: 30/1 > do-nothing
1: 30/3 > attack
> 2's life: 30 -> 25
2: 25/3 > do-nothing
2: 25/5 > quick-attack
> 1's life: 30 -> 28
1: 28/1 > quick-attack
> 2's life: 25 -> 23
2: 23/4 > deffence
1: 28/0 > do-nothing
2: 23/5 > deffence
1: 28/2 > do-nothing
2: 23/6 > quick-attack
> 1's life: 28 -> 26
1: 26/4 > attack
> 2's life: 23 -> 18
2: 18/5 > attack
> 1's life: 26 -> 21
1: 21/2 > attack
> 2's life: 18 -> 13
2: 13/3 > attack
> 1's life: 21 -> 16
1: 16/0 > deffence
2: 13/1 > deffence
1: 16/1 > do-nothing
2: 13/2 > deffence
2: 13/3 > do-nothing
1: 16/3 > attack
> 2's life: 13 -> 8
2: 8/5 > do-nothing
1: 16/1 > quick-attack
> 2's life: 8 -> 6
1: 16/0 > deffence
2: 6/7 > attack
> 1's life: 16 -> 15
1: 15/1 > quick-attack
> 2's life: 6 -> 4
2: 4/5 > do-nothing
1: 15/0 > deffence
1: 15/1 > quick-attack
> 2's life: 4 -> 2
2: 2/7 > attack
> 1's life: 15 -> 10
1: 10/0 > deffence
2: 2/5 > quick-attack
> no damage!
1: 10/1 > quick-attack
> 2's life: 2 -> 0

-----

1: 30/0 > deffence
2: 30/0 > do-nothing
1: 30/1 > quick-attack
> 2's life: 30 -> 28
2: 28/2 > deffence
1: 30/0 > do-nothing
2: 28/3 > deffence
1: 30/2 > do-nothing
2: 28/4 > do-nothing
1: 30/4 > attack
> 2's life: 28 -> 23
2: 23/6 > quick-attack
> 1's life: 30 -> 28
2: 23/5 > deffence
1: 28/2 > do-nothing
2: 23/6 > quick-attack
> 1's life: 28 -> 26
1: 26/4 > attack
> 2's life: 23 -> 18
2: 18/5 > quick-attack
> 1's life: 26 -> 24
2: 18/4 > do-nothing
1: 24/2 > attack
> 2's life: 18 -> 13
2: 13/6 > attack
> 1's life: 24 -> 19
1: 19/0 > do-nothing
2: 13/4 > do-nothing
1: 19/2 > attack
> 2's life: 13 -> 8
2: 8/6 > quick-attack
> 1's life: 19 -> 17
2: 8/5 > quick-attack
> 1's life: 17 -> 15
1: 15/0 > do-nothing
2: 8/4 > quick-attack
> 1's life: 15 -> 13
1: 13/2 > attack
> 2's life: 8 -> 3
2: 3/3 > attack
> 1's life: 13 -> 8
1: 8/0 > deffence
2: 3/1 > attack
Failed: 2's attack
1: 8/1 > quick-attack
> 2's life: 3 -> 1
2: 1/2 > quick-attack
> 1's life: 8 -> 6
1: 6/0 > do-nothing
2: 1/1 > do-nothing
1: 6/2 > attack
> 2's life: 1 -> -4
```

## LICENSE

MIT
