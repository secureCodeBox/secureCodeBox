---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Blinmaker
author: Daniel Patanin
author_title: Maintainer of securecodebox.io
author_url: https://github.com/dpatanin
author_image_url: https://avatars1.githubusercontent.com/u/44839597?s=400&u=df006f35797ebb585d8279513305a0bbf1f616b5&v=4
tags: [cooking, blini]
description: This is my first post on securecodebox.io.
image: /img/blog/2020-09-08-blini.jpg
---

![Blini](/img/blog/2020-09-08-blini.jpg)

This is the first post on the new [securecodebox.io](https://securecodebox.io) documentation. What would be better than to teach you how to make some Blini. 😸

<!--truncate-->

## Making the Blin

Blini are from Eastern Europe. They're basically pancakes in 10 times as thin, but 10 times as good and easy to make. The main components are some eggs, milk and flour.
Nothing extraordinary, actually three very basic things that you have at home most of the time. For one portion of Blini you will need 1 chicken produce, 200ml cow juice and 100g dry snow.
Mix them together and you are ready to make 4 Blini.

:::info Blinmaker
If you think: "But i can't memorize that amounts, is there an easier way? Yes there is! Meet the [Blinmaker](#the-blinmaker). You can also compute the amount of Blini you can make right [here](#computing-blin-amount). "
:::

As for actually making the Blini, it's even easier:

1. Take a pan
   - Heat it up
2. Add a small amount of yellow cooking slime (source may be your choice)
3. Pour in the liquid Blini until they just cover the surface of the pan
   1. Keep the pan hot while you wait until the blin magically solidifies.
   2. Carefully flip the Blin...
      - before it starts burning
      - and when it is somewhat solid, but not for a long time
4. Remove the Blin when it is ready.
5. Eat your Blini.

:::caution Watch your Blini
Warning! You better pay attention! If not, your neighbor Vadim might steal some Blini while you are not looking!
:::

## Serving the Blin

When you are ready to eat some Blini and think: "This is not bad but something is missing.", Then you're absolutely right. See, while Blini are delicious themselves, their true potential lies in the toppings you eat them with. Pretty much anything sweet you like will make you very happy, but there are also some different things you may try:

| Sweet             | Not sweet  |        Drinks |
| :---------------- | :--------: | ------------: |
| Honey             |  Mustard   |          Milk |
| Jam               | Sour Cream |           Tea |
| Maple syrup       | Mayonnaise |   Fruit juice |
| Chocolate cream   |            | Hot Chocolate |
| Berries or fruits |            |        Coffee |
| Ice cream         |            |

:::tip
Blini fit very nicely in lunch bags.
:::

## The Blinmaker

Meet the **_Blinmaker_**. It is a magnificent tool which computes how many Blini you can make with what you have at home.

### Blinmaker in different languages

Here is the Blinmaker in different languages. Just copy, paste and click run whenever you need to know how many Blini you can make!

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs
defaultValue="rs"
values={[
{ label: 'Rust', value: 'rs', },
{ label: 'Python', value: 'py', },
{ label: 'Java', value: 'java', },
]
}>
<TabItem value="rs">

```rust
pub const EGGS_MIN: i32 = 1;
pub const FLOUR_MIN: f32 = 100.0;
pub const MILK_MIN: f32 = 200.0;
pub fn find_blin_amount(mut flour_amount: f32, mut milk_amount: f32, mut eggs_amount: i32) -> f32 {
    flour_amount = flour_amount / FLOUR_MIN;
    eggs_amount = eggs_amount / EGGS_MIN;
    milk_amount = milk_amount / MILK_MIN;
    let smallest: f32;
    if flour_amount <= milk_amount && flour_amount <= eggs_amount as f32{
        smallest = flour_amount as f32;
        return smallest * 6.0;
    }
    else if milk_amount <= flour_amount && milk_amount <= eggs_amount as f32 {
        smallest = milk_amount as f32;
        return smallest * 6.0;
    }
    else if eggs_amount as f32 <= flour_amount && eggs_amount as f32 <= milk_amount {
        smallest = eggs_amount as f32;
        return smallest as f32 * 6.0;
    }
    else{
        return -1 as f32;
    }
}
pub fn find_materials_amount(mut flour_amount: f32, mut milk_amount: f32, mut eggs_amount: i32) -> (f32,f32,i32) {
    flour_amount = flour_amount / FLOUR_MIN;
    eggs_amount = eggs_amount / EGGS_MIN;
    milk_amount = milk_amount / MILK_MIN;
    let mut smallest: f32 = 0.0;
    if flour_amount<=milk_amount && flour_amount<=eggs_amount as f32 {
        smallest = flour_amount as f32;
    }
    else if milk_amount<=flour_amount && milk_amount<=eggs_amount as f32 {
        smallest = milk_amount as f32;
    }
    else if eggs_amount as f32<=flour_amount && eggs_amount as f32<=milk_amount {
        smallest = eggs_amount as f32;
    }
    (smallest * FLOUR_MIN, smallest * MILK_MIN, smallest as i32 * EGGS_MIN)
}
```

</TabItem>

<TabItem value="py">

```py
i=""
while i !='stop':
  eggamount = int(input("how many eggs do you have?"))
  eggsneeded = 3
  milkamount = int(input("how much milk do you have?"))
  milkneeded = 1
  flouramount = int(input("how much flour do you have?"))
  flourneeded = 2
if eggamount < eggsneeded and milkamount < milkneeded and flouramount < flourneeded:
  print("no")
else:
  list1=[]
  eggamount1 = eggamount // eggsneeded
  milkamount1 = milkamount // milkneeded
  flouramount1 = flouramount // flourneeded
  print('you have' ,eggamount1,"portions of eggs")
  print("you have", flouramount1,"portions of flour")
  print("you have" ,milkamount1,"portions of milk")
  list1.append(eggamount1)
  list1.append(milkamount1)
  list1.append(flouramount1)
  print("you can make" ,min(list1) ,"blin")
  i=input(
  '''
  type stop if you wish to stop the program
  type anything to continue'''
  )
```

</TabItem>
<TabItem value="java">

```java
package blinmaker;

import java.util.Scanner;

public class cooker {

  public static void main(String[] args) {
    int eggsAmount;
    int eggsMin = 1;
    int milkAmount;
    int milkMin = 200; // milliliter
    int flourAmount;
    int flourMin = 100; // grams

    System.out.println("Hello!");
    System.out.println("Blinmaker ist starting up..");
    System.out.println("How many egges do you have?");

    Scanner userInput;
    userInput = new Scanner(System.in);
    eggsAmount = userInput.nextInt();
    System.out.println("You have " + eggsAmount + " eggs.");

    System.out.println("How much milk do you have?");
    userInput = new Scanner(System.in);
    milkAmount = userInput.nextInt();
    System.out.println("You have " + milkAmount + "ml milk.");

    System.out.println("How much flour do you have?");
    userInput = new Scanner(System.in);
    flourAmount = userInput.nextInt();
    System.out.println("You have " + flourAmount + "g flour.");

    if(eggsAmount < eggsMin || milkAmount < milkMin || flourAmount < flourMin) {
      System.out.println("No blin today :(");
    } else {
      int flourPortions = flourAmount / flourMin;
      int milkPortions = milkAmount / milkMin;

      int smallest = Math.min(Math.min(flourPortions, milkPortions), eggsAmount);

      System.out.println(" ");
      System.out.println("You can make " + smallest*4 + " Blini.");
      System.out.println(" ");
      System.out.println("You will need " + smallest*eggsMin + " eggs.");
      System.out.println("You will need " + smallest*milkMin + " milk.");
      System.out.println("You will need " + smallest*flourMin + " flour.");
      System.out.println("Blinmaker shutting down...");
    }
  }
}
```

</TabItem>
</Tabs>

### Computing Blin Amount

If you say you want to make some Blini right now, then here you go, a Blinmaker ready to use.

:::note Did you know
With this live editor you can change the blinmaker to use e.g. imperial units, if you're a western spy.
:::

```jsx live
class BlinMaker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      eggsAmount: 0,
      milkAmount: 0,
      flourAmount: 0,
    };

    this.computeBlinAmount = this.computeBlinAmount.bind(this);
  }

  computeBlinAmount() {
    const eggsMin = 1;
    const milkMin = 200; // milliliter
    const flourMin = 100; // grams

    if (
      this.state.eggsAmount < eggsMin ||
      this.state.milkAmount < milkMin ||
      this.state.flourAmount < flourMin
    ) {
      alert("No blin today :(");
    } else {
      const flourPortions = Math.floor(this.state.flourAmount / flourMin);
      const milkPortions = Math.floor(this.state.milkAmount / milkMin);

      const smallest = Math.min(
        this.state.eggsAmount,
        flourPortions,
        milkPortions
      );
      const Blini = smallest * 4;

      alert(
        `You can make ${Blini} Blini. You will need ${
          smallest * eggsMin
        } eggs, ${smallest * milkMin}ml milk and ${smallest * flourMin}g flour.`
      );
    }
  }

  render() {
    const gridStyle = {
      display: "inline-block",
      width: "50%",
      minWidth: "max-content",
    };

    const inputStyle = {
      float: "right",
    };

    const buttonStyle = {
      backgroundColor: "#55a8e2",
      maxWidth: "200px",
      height: "30px",
      font: "400 14px/18px Roboto, sans-serif",
      marginTop: "10px",
      border: "none",
      cursor: "pointer",
    };

    return (
      <div style={gridStyle}>
        <label>
          Egg amount:
          <input
            type="number"
            style={inputStyle}
            value={this.state.eggsAmount}
            onChange={(event) =>
              this.setState({ eggsAmount: event.target.value })
            }
          />
        </label>
        <br />
        <label>
          Milk amount:
          <input
            type="number"
            step="50"
            style={inputStyle}
            value={this.state.milkAmount}
            onChange={(event) =>
              this.setState({ milkAmount: event.target.value })
            }
          />
        </label>
        <br />
        <label>
          Flour amount:
          <input
            type="number"
            step="50"
            style={inputStyle}
            value={this.state.flourAmount}
            onChange={(event) =>
              this.setState({ flourAmount: event.target.value })
            }
          />
        </label>
        <br />
        <button style={buttonStyle} onClick={this.computeBlinAmount}>
          Compute Blinamount
        </button>
      </div>
    );
  }
}
```

:::danger
Don't make too many Blini. Throwing them away is a crime in eastern Europe!
:::
